import {
  ChangeDetectorRef,
  ElementRef,
  Injectable,
  NgZone,
  OnDestroy,
} from '@angular/core';

import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { SelectionModel } from '@angular/cdk/collections';

import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FsTreeDatabaseService } from './tree-database.service';

import { ItemNode } from '../models/item-node.model';
import { FlatItemNode } from '../models/flat-item-node.model';

import { getLevel } from '../helpers/get-level';
import { isExpandable } from '../helpers/is-expandable';
import { dataBuilder } from '../helpers/data-builder';
import { getChildren } from '../helpers/get-children';

import { ITreeConfig } from '../interfaces/config.interface';
import { IDragEnd } from '../interfaces/draggable.interface';
import { ITreeDataChange } from '../interfaces/tree-data-change.interface';

import { FsTreeChange } from '../enums/tree-change.enum';


@Injectable()
export class FsTreeService<T> implements OnDestroy {

  public config: ITreeConfig<T> = {};

  public treeControl: FlatTreeControl<FlatItemNode>;
  public treeFlattener: MatTreeFlattener<ItemNode, FlatItemNode>;
  public dataSource: MatTreeFlatDataSource<ItemNode, FlatItemNode>;

  // Nodes can be dragged&dropped. Draggable flag
  public reorder = true;

  // Possibility to expand/collapse for nodes
  public blocked = false;

  /** The selection for checklist */
  public checklistSelection = new SelectionModel<FlatItemNode>(true /* multiple */);

  private _updateClasses$ = new Subject<void>();

  private _destroy$ = new Subject<void>();

  constructor(
    private _database: FsTreeDatabaseService<T>,
    private _cd: ChangeDetectorRef,
    private _zone: NgZone,
  ) {
    this.treeFlattener = new MatTreeFlattener(this.transformer, getLevel, isExpandable, getChildren);
    this.treeControl = new FlatTreeControl<FlatItemNode>(getLevel, isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  }

  public get updateClasses$(): Observable<void> {
    return this._updateClasses$.asObservable();
  }

  public init(el: ElementRef, config) {
    this._subscribeToDataChange();
    this._database.containerElement = el;
    this.config = config;

    this._database.initialize(this.treeControl, this.config);

    if (this.config.selection?.selected) {
      this.treeControl.dataNodes
        .filter((node: FlatItemNode) => this.config.selection.selected(node.original))
        .forEach((node: FlatItemNode) => {
          this._selectNode(node);
        });
    }
  }

  public ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  public transformer = (node: ItemNode, level: number) => {
    const existingNode = this._database.nestedNodeMap.get(node);
    const flatNode = existingNode && existingNode.data === node.data
      ? existingNode
      : new FlatItemNode();

    flatNode.data = node.data;
    flatNode.original = node;
    flatNode.parent = this._database.nestedNodeMap.get(node.parent);
    flatNode.originalParent = this._database.flatNodeMap.get(flatNode.parent);
    flatNode.level = level;
    flatNode.expandable = (node.children && node.children.length > 0);
    flatNode.isExpanded = () => this.treeControl.isExpanded(flatNode);
    flatNode.collapse = () => this.treeControl.collapse(flatNode);
    flatNode.expand = () => this.treeControl.expand(flatNode);
    flatNode.canDrag = this.config.canDrag ? this.config.canDrag(flatNode) : true;

    this._database.flatNodeMap.set(flatNode, node);
    this._database.nestedNodeMap.set(node, flatNode);

    return flatNode;
  };

  /** Whether all the descendants of the node are selected */
  public descendantsAllSelected(node: FlatItemNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    return descendants.every(child => this.checklistSelection.isSelected(child));
  }

  /** Whether part of the descendants are selected */
  public descendantsPartiallySelected(node: FlatItemNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some(child => this.checklistSelection.isSelected(child));
    return result && !this.descendantsAllSelected(node);
  }

  /** Toggle the to-do item selection. Select/deselect all the descendants node */
  public todoItemSelectionToggle(node: FlatItemNode): void {
    const nodeSelected = this.checklistSelection.isSelected(node);
    this.checklistSelection.toggle(node);

    if (nodeSelected) {
      this._deselectNode(node);
    } else {
      this._selectNode(node);
    }

    this._emitSelectionChange();
  }


  /** Toggle a leaf to-do item selection. Check all the parents to see if they changed */
  public todoLeafItemSelectionToggle(node: FlatItemNode): void {
    this.checklistSelection.toggle(node);
    this.checkAllParentsSelection(node);

    this._emitSelectionChange();
  }

  /** Checks all the parents when a leaf node is selected/unselected **/
  public checkAllParentsSelection(node: FlatItemNode): void {
    let parent: FlatItemNode | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  /** Get the parent node of a node **/
  public getParentNode(node: FlatItemNode): FlatItemNode | null {
    const currentLevel = getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];

      if (getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }

  /** Check root node checked state and change it accordingly */
  public checkRootNodeSelection(node: FlatItemNode): void {
    const nodeSelected = this.checklistSelection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.every(child =>
      this.checklistSelection.isSelected(child)
    );
    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.checklistSelection.select(node);
    }
  }

  /**
   * Setup drag
   * @param node
   */
  public onDragStart(node: FlatItemNode) {}

  public onDrop(data: IDragEnd) {
    if (data.dropInto === data.node) { return; }

    const dropInto = this._database.flatNodeMap.get(data.dropInto);
    const node = this._database.flatNodeMap.get(data.node);
    const fromParent = node.parent;
    let insertIndex = null;

    if (data.dropPosition === 'above') {
      insertIndex = this._database.insertNodeAbove(dropInto, node);
    } else if (data.dropPosition === 'below') {
      insertIndex = this._database.insertNodeBelow(dropInto, node);
    } else {
      insertIndex = this._database.insertNode(dropInto, node);
    }

    // Run in zone back because before it was ran outside angular
    this._zone.run(() => {
      // Notify about data change
      const payload = {
        fromParent: fromParent,
        toParent: node.parent,
        node: node,
        index: insertIndex,
      };

      this._database.updateData(FsTreeChange.Reorder, payload);
    });
  }

  /**
   * Custom method for expand/collapse, because we must check blocked flag before
   * @param node
   */
  public toggleNode(node) {
    if (!this.blocked) {
      if (this.treeControl.isExpanded(node)) {
        this.treeControl.collapse(node);
      } else {
        this.treeControl.expand(node);
      }
    }
  }

  /**
   * Transform tree to object
   */
  public getData() {
    return dataBuilder(this.dataSource.data, this.config.childrenName);
  }

  /**
   * Collapse nodes
   */
  public collapseAll() {
    this.treeControl.collapseAll();
  }

  /**
   * Expand nodes
   */
  public expandAll() {
    this.treeControl.expandAll();
  }

  /**
   * Enable drag&drop
   */
  public enableReorder() {
    this.reorder = true;

    this._cd.markForCheck();
  }

  /**
   * Disable drag&drop
   */
  public disableReorder() {
    this.reorder = false;

    this._cd.markForCheck();
  }

  /**
   * Insert element above target
   * @param data
   * @param target
   */
  public insertNodeAbove(data: any = {}, target: FlatItemNode = null) {
    const originalParent = target && target.original || null;
    const node = this._database.createNode(data, target);
    const insertIndex = this._database.insertNodeAbove(originalParent, node.original);

    // Notify about data change
    const payload = {
      position: 'above',
      parent: target,
      node: node,
      index: insertIndex,
    };

    this._database.updateData(FsTreeChange.Insert, payload);
  }

  /**
   * Insert element below target
   * @param data
   * @param target
   */
  public insertNodeBelow(data: any = {}, target: FlatItemNode = null) {
    const originalParent = target && target.original || null;
    const node = this._database.createNode(data, target);
    const insertIndex = this._database.insertNodeBelow(originalParent, node.original);

    // Notify about data change
    const payload = {
      position: 'below',
      parent: target,
      node: node,
      index: insertIndex,
    };

    this._database.updateData(FsTreeChange.Insert, payload);
  }

  /**
   * Insert element as child element for target node
   * @param data
   * @param parent
   */
  public appendNode(data: any = {}, parent: FlatItemNode = null) {
    const originalParent = parent && parent.original || null;
    const node = this._database.createNode(data, parent);

    this._database.insertNode(originalParent, node.original);

    if (parent && !parent.isExpanded()) {
      parent.expand();
    }

    // Notify about data change
    const payload = {
      position: 'into',
      parent: parent,
      node: node,
      index: 0,
    };

    this._database.updateData(FsTreeChange.Insert, payload);
  }

  /**
   * Update internal data for target
   * @param data
   * @param target
   */
  public updateNodeData(data: any = {}, target: FlatItemNode) {
    target.data = data;

    // Notify about data change
    const payload = {
      node: target
    };

    this._database.updateData(FsTreeChange.Update, payload);
  }

  /**
   * Remove node from DB
   * @param item
   */
  public removeNode(item: FlatItemNode) {
    this._database.removeItem(item.original);

    const payload = {
      target: item.original,
    };
    this._database.updateData(FsTreeChange.Remove, payload);
  }

  /**
   * Do reorder for target
   * @param target
   */
  public updateSort(target: ItemNode) {
    this._database.updateSort(target);

    const payload = {
      node: target,
    };
    this._database.updateData(FsTreeChange.ManualReorder, payload);
  }

  /**
   * Disabled reorder and block tree
   */
  public lockTree() {
    this.disableReorder();
    this.blocked = true;

    this._cd.markForCheck();
  }

  /**
   * Enable reorder back and unlock tree
   */
  public unlockTree() {
    this.enableReorder();
    this.blocked = false;

    this._cd.markForCheck();
  }

  public updateNodesClasses() {
    this._updateClasses$.next();
  }

  private _selectNode(node: FlatItemNode) {
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.select(node, ...descendants);

    this.checkAllParentsSelection(node);
  }

  private _deselectNode(node: FlatItemNode) {
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.deselect(node, ...descendants);

    this.checkAllParentsSelection(node);
  }

  private _subscribeToDataChange() {
    this._database.dataChange
      .pipe(
        takeUntil(this._destroy$),
      )
      .subscribe((event: ITreeDataChange) => {
        this.dataSource.data = [];
        this.dataSource.data = this._database.data;

        if (this.config.change) {
          this.config.change(event);
        }
      });
  }

  private _emitSelectionChange() {
    if (this.config.selection.change) {
      const selected: ItemNode[] = this.checklistSelection.selected
        .map((node) => {
          return this._database.flatNodeMap.get(node);
        });


      this.config.selection.change(selected);
    }
  }
}
