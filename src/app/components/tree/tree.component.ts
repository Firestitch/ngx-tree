import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ElementRef,
  Input, OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FsTreeService } from '../../services/tree.service';

import { ItemNode } from '../../models/item-node.model';
import { FlatItemNode } from '../../models/flat-item-node.model';
import { Action } from '../../models/action.model';

import { getLevel } from '../../helpers/get-level';
import { isExpandable } from '../../helpers/is-expandable';
import { dataBuilder } from '../../helpers/data-builder';
import { getChildren } from '../../helpers/get-children';

import { FsTreeNodeDirective } from '../../directives/tree-node.directive';
import { ITreeConfig } from '../../interfaces/config.interface';
import { IDragEnd } from '../../interfaces/draggable.interface';
import { LoggerService } from '../../services/logger.service';


@Component({
  selector: 'fs-tree',
  templateUrl: 'tree.component.html',
  styleUrls: [ 'tree.component.scss' ],
  providers: [FsTreeService, LoggerService ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FsTreeComponent<T> implements OnInit, OnDestroy {

  @Input()
  public config: ITreeConfig<T> = {};

  @ViewChild('emptyItem')
  public emptyItem: ElementRef;

  // Template for node
  @ContentChild(FsTreeNodeDirective, { read: TemplateRef })
  public nodeTemplate: TemplateRef<any>;

  public treeControl: FlatTreeControl<FlatItemNode>;

  public treeFlattener: MatTreeFlattener<ItemNode, FlatItemNode>;

  public dataSource: MatTreeFlatDataSource<ItemNode, FlatItemNode>;

  // List of actions for tree
  public actions: Action[] = [];

  // Nodes can be dragged&dropped. Draggable flag
  public reorder = true;

  // Possibility to expand/collapse for nodes
  public blocked = false;

  /** The selection for checklist */
  public checklistSelection = new SelectionModel<FlatItemNode>(true /* multiple */);

  private _expandedBeforeDrag = false;

  private _destroy$ = new Subject<void>();

  constructor(private _database: FsTreeService, private _logger: LoggerService, private _cd: ChangeDetectorRef) {
    this.treeFlattener = new MatTreeFlattener(this.transformer, getLevel, isExpandable, getChildren);
    this.treeControl = new FlatTreeControl<FlatItemNode>(getLevel, isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    // this._logger.enabled = true;
  }

  public ngOnInit() {
    this._database.initialize(this.treeControl, this.config.data, this.config.childrenName, this.config.levels);
    this.actions = this.config.actions ? this.config.actions.map((action) => new Action(action)) : [];

    this._database.dataChange
      .pipe(
        takeUntil(this._destroy$),
      )
      .subscribe(data => {
        this.dataSource.data = [];
        this.dataSource.data = data;

        if (this.config.changed) {
          this.config.changed(this.getData());
        }
      });
  }

  public ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public hasChild(_: number, _nodeData: FlatItemNode): boolean {
    return _nodeData.expandable;
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
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);
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

    if (data.dropPosition === 'above') {
      this._database.insertNodeAbove(dropInto, node);
    } else if (data.dropPosition === 'below') {
      this._database.insertNodeBelow(dropInto, node);
    } else {
      this._database.insertNode(dropInto, node);
    }
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
   * Insert element as child element for target node
   * @param data
   * @param parent
   */
  public appendElement(data: any = {}, parent: FlatItemNode = null) {
    const originalParent = parent && parent.original || null;
    const node = this._database.createNode(data, parent);
    this._database.insertNode(originalParent, node.original);
    if (!parent.isExpanded()) {
      parent.expand();
    }
  }

  /**
   * Remove node from DB
   * @param item
   */
  public removeNode(item: FlatItemNode) {
    this._database.removeItem(item.original);
    this._database.changeData();
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
}
