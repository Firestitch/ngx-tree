import {
  ChangeDetectorRef,
  ElementRef,
  Injectable,
  NgZone,
  OnDestroy,
} from '@angular/core';

import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl, FlatTreeControlOptions } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';

import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


import { TreeDragAxis } from '../enums/drag-axis.enum';
import { FsTreeChange } from '../enums/tree-change.enum';
import { dataBuilder } from '../helpers/data-builder';
import { getChildren } from '../helpers/get-children';
import { getLevel } from '../helpers/get-level';
import { isExpandable } from '../helpers/is-expandable';
import {
  ITreeChangeInsert, ITreeChangeRemove, ITreeChangeReorder, ITreeConfig,
} from '../interfaces';
import { IDragEnd } from '../interfaces/draggable.interface';
import { ITreeDataChange } from '../interfaces/tree-data-change.interface';
import { FlatItemNode } from '../models/flat-item-node.model';
import { ItemNode } from '../models/item-node.model';

import { FsTreeDatabaseService } from './tree-database.service';


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
  public checklistSelection: SelectionModel<FlatItemNode>;

  private _updateClasses$ = new Subject<void>();

  private _destroy$ = new Subject<void>();

  constructor(
    private _database: FsTreeDatabaseService<T>,
    private _cd: ChangeDetectorRef,
    private _zone: NgZone,
  ) {}

  public get updateClasses$(): Observable<void> {
    return this._updateClasses$.asObservable();
  }

  public get dataChange$(): Observable<ItemNode[]> {
    return this._database.data$;
  }

  public init(el: ElementRef, config) {
    this._subscribeToDataChange();
    this._database.containerElement = el;
    this.config = {
      ...config,
      draggable: config.draggable ?? true,
      dragAxis: config.dragAxis ?? TreeDragAxis.XY,
    };

    this._initDependencies();

    this._database.initialize(this.treeControl, this.config);
    this._updateSelected();
    this._updateExpanded();
  }

  public ngOnDestroy() {
    this._destroy$.next(null);
    this._destroy$.complete();
  }

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  // eslint-disable-next-line max-statements
  public transformer = (node: ItemNode, level: number) => {
    const existingNode = this._database.nestedNodeMap.get(node);
    const flatNode = existingNode && existingNode.data === node.data
      ? existingNode
      : new FlatItemNode();

    flatNode.original = node;
    flatNode.parent = this.getFlatItemNode(node.parent);
    flatNode.originalParent = this.getItemNode(flatNode.parent);
    flatNode.level = level;
    flatNode.levelName = this.config.levelName ? this.config.levelName(level) : null;
    flatNode.expandable = (node.children && node.children.length > 0);
    flatNode.isExpanded = () => this.treeControl.isExpanded(flatNode);
    flatNode.collapse = () => this.treeControl.collapse(flatNode);
    flatNode.expand = () => this.treeControl.expand(flatNode);
    flatNode.canDrag = this.config.canDrag ? this.config.canDrag(flatNode) : true;

    const nodesList = level === 0
      ? this._database.data
      : flatNode.originalParent.children;

    flatNode.index = level === 0
      ? nodesList.indexOf(node)
      : nodesList.indexOf(node);
    flatNode.first = nodesList.indexOf(node) === 0;
    flatNode.last = nodesList.length - 1 === flatNode.index;
    flatNode.data = node.data;
    flatNode.canNodeClick = this.config.canNodeClick ? this.config.canNodeClick(flatNode) : false;

    this._database.flatNodeMap.set(flatNode, node);
    this._database.nestedNodeMap.set(node, flatNode);

    return flatNode;
  };

  public getFlatItemNode(node): FlatItemNode {
    return this._database.nestedNodeMap.get(node);
  }

  public getItemNode(node): ItemNode {
    return this._database.flatNodeMap.get(node);
  }

  /** Whether all the descendants of the node are selected */
  public descendantsAllSelected(node: FlatItemNode): boolean {
    const descendants = this.treeControl.getDescendants(node);

    return descendants.every((child) => this.checklistSelection.isSelected(child));
  }

  /** Whether part of the descendants are selected */
  public descendantsPartiallySelected(node: FlatItemNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants
      .some((child) => this.checklistSelection.isSelected(child));

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
    const descAllSelected = descendants.every((child) =>
      this.checklistSelection.isSelected(child),
    );
    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.checklistSelection.select(node);
    }
  }

  /**
   * Setup drag
   *
   * @param node
   */
  public onDragStart(node: FlatItemNode) {
    //
  }

  public onDrop(data: IDragEnd) {
    if (data.dropInto === data.node) {
      return;
    }

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
      const payload: ITreeChangeReorder = {
        fromParent: this.getFlatItemNode(fromParent),
        toParent: this.getFlatItemNode(node.parent),
        node: data.node,
        index: insertIndex,
      };

      this._database.updateData(FsTreeChange.Reorder, payload);
    });
  }

  public nodeClick(node: FlatItemNode) {
    if (this.config.nodeClick) {
      this.config.nodeClick({ node });
    }
  }

  /**
   * Custom method for expand/collapse, because we must check blocked flag before
   *
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

  public setData(data: unknown): void {
    this.checklistSelection.clear();

    this._database.setData(data);
    this._updateSelected();
    this._updateExpanded();
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
   *
   * @param data
   * @param target
   */
  public insertNodeAbove(data: any = {}, target: FlatItemNode = null): FlatItemNode {
    const originalParent = target && target.original || null;
    const node = this._database.createNode(data, target);
    const insertIndex = this._database.insertNodeAbove(originalParent, node.original);

    // Notify about data change
    const payload: ITreeChangeInsert = {
      position: 'above',
      parent: target,
      node,
      index: insertIndex,
    };

    this._database.updateData(FsTreeChange.Insert, payload);

    return node;
  }

  /**
   * Insert element below target
   *
   * @param data
   * @param target
   */
  public insertNodeBelow(data: any = {}, target: FlatItemNode = null): FlatItemNode {
    const originalParent = target && target.original || null;
    const node = this._database.createNode(data, target);
    const insertIndex = this._database.insertNodeBelow(originalParent, node.original);

    // Notify about data change
    const payload: ITreeChangeInsert = {
      position: 'below',
      parent: target,
      node,
      index: insertIndex,
    };

    this._database.updateData(FsTreeChange.Insert, payload);

    return node;
  }

  /**
   * Insert element as child element for target node
   *
   * @param data
   * @param parent
   */
  public appendNode(data: any = {}, parent: FlatItemNode = null): FlatItemNode {
    const originalParent = parent && parent.original || null;
    const node = this._database.createNode(data, parent);

    this._database.insertNode(originalParent, node.original);

    if (parent && !parent.isExpanded()) {
      parent.expand();
    }

    // Notify about data change
    const payload: ITreeChangeInsert = {
      position: 'into',
      parent,
      node,
      index: 0,
    };

    this._database.updateData(FsTreeChange.Insert, payload);

    return node;
  }

  /**
   * Update internal data for target
   *
   * @param data
   * @param target
   */
  public updateNodeData(data: any = {}, target: FlatItemNode) {
    target.data = data;

    // Notify about data change
    const payload = {
      node: target,
    };

    this._database.updateData(FsTreeChange.Update, payload);
  }

  /**
   * Remove node from DB
   *
   * @param item
   */
  public removeNode(item: FlatItemNode) {
    this._database.removeItem(item.original);

    const payload: ITreeChangeRemove = {
      target: this.getFlatItemNode(item.original),
    };

    this._database.updateData(FsTreeChange.Remove, payload);
  }

  /**
   * Do reorder for target
   *
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
    this._updateClasses$.next(null);
  }

  public unselectAll(): void {
    this.checklistSelection.clear();
    this._updateSelected();
  }

  /**
   * @deprecated Use getChildrenNodes instead
   */
  public getNodes(rootNode?: FlatItemNode): FlatItemNode[] {
    return this.getChildrenNodes(rootNode);
  }

  public getSiblingNodes(rootNode?: FlatItemNode): FlatItemNode[] {
    if (rootNode) {
      return this.getChildrenNodes(rootNode.parent);
    }

    return [];
  }

  public getChildrenNodes(rootNode?: FlatItemNode): FlatItemNode[] {
    if (rootNode) {
      const rootNodeItem = this.getItemNode(rootNode);
      const children = rootNodeItem.children
        .map((nodeItem) => {
          return this.getFlatItemNode(nodeItem);
        });

      return children;
    }

    return this.treeControl.dataNodes
      .filter((nodeItem) => {
        return !nodeItem.parent;
      });
  }

  public filterVisibleNodes(query: string): void {
    if (!query) {
      return;
    }

    this.treeControl.collapseAll();

    this._database.treeControl.dataNodes
      .filter ((node) => this.config.filterItem(node.original, query))
      .forEach((node) => {
        if (node.parent) {
          node.parent.expand();
        }
      });
  }

  private _initDependencies(): void {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      getLevel,
      isExpandable,
      getChildren,
    );

    this.treeControl = new FlatTreeControl<FlatItemNode>(getLevel, isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    this.checklistSelection = new SelectionModel<FlatItemNode>(true);
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
        this.dataSource.data = [...this._database.data];

        if (this.config.change) {
          this.config.change(event);
        }

        if (event.type === FsTreeChange.Init && this.config.init) {
          this.config.init(event.payload);
        }

        if (event.type === FsTreeChange.Insert && this.config.changeInsert) {
          this.config.changeInsert(event.payload);
        }

        if (event.type === FsTreeChange.Remove && this.config.changeRemove) {
          this.config.changeRemove(event.payload);
        }

        if (event.type === FsTreeChange.Update && this.config.changeUpdate) {
          this.config.changeUpdate(event.payload);
        }

        if (event.type === FsTreeChange.Reorder && this.config.changeReorder) {
          this.config.changeReorder(event.payload);
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

  private _updateSelected(): void {
    if (this.config.selection?.selected) {
      this.treeControl.dataNodes
        .filter((node: FlatItemNode) => this.config.selection.selected(node.original))
        .forEach((node: FlatItemNode) => {
          this._selectNode(node);
        });
    }
  }

  private _updateExpanded(): void {
    if (this.config.expandLevel) {
      this.treeControl.dataNodes
        .filter((node: FlatItemNode) => this.config.expandLevel === Infinity || this.config.expandLevel > node.level)
        .forEach((node: FlatItemNode) => {
          node.expand();
        });
    }
  }
}
