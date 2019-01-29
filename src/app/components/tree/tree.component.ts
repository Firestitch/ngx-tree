import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ElementRef,
  Input,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';

import { Observable } from 'rxjs';

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


@Component({
  selector: 'fs-tree',
  templateUrl: 'tree.component.html',
  styleUrls: [ 'tree.component.scss' ],
  providers: [ FsTreeService ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FsTreeComponent<T> implements OnInit {

  @Input()
  public config: ITreeConfig<T> = {};

  @ViewChild('emptyItem')
  public emptyItem: ElementRef;

  // Template for node
  @ContentChild(FsTreeNodeDirective, { read: TemplateRef })
  public nodeTemplate: TemplateRef<any>;

  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  public flatNodeMap = new Map<FlatItemNode, ItemNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  public nestedNodeMap = new Map<ItemNode, FlatItemNode>();

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

  // Drag & Drop state object
  public drag = {
    node: null,
    expandOverWaitTime: 300,
    expandOverTime: null,
    expandOverArea: null,
    expandOverNode: null,
    expandStatus: false
  };

  constructor(private _database: FsTreeService, private _cd: ChangeDetectorRef) {
    this.treeFlattener = new MatTreeFlattener(this.transformer, getLevel, isExpandable, getChildren);
    this.treeControl = new FlatTreeControl<FlatItemNode>(getLevel, isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  }

  public ngOnInit() {
    this._database.initialize(this.config.data, this.config.childrenName, this.config.levels);
    this.actions = this.config.actions ? this.config.actions.map((action) => new Action(action)) : [];

    this._database.dataChange.subscribe(data => {
      this.dataSource.data = [];
      this.dataSource.data = data;

      if (this.config.changed) {
        this.config.changed(this.getData());
      }
    });
  }

  public hasChild(_: number, _nodeData: FlatItemNode): boolean {
    return _nodeData.expandable;
  }

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  public transformer = (node: ItemNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode = existingNode && existingNode.data === node.data
      ? existingNode
      : new FlatItemNode();

    flatNode.data = node.data;
    flatNode.original = node;
    flatNode.parent = this.nestedNodeMap.get(node.parent);
    flatNode.originalParent = this.flatNodeMap.get(flatNode.parent);
    flatNode.level = level;
    flatNode.expandable = (node.children && node.children.length > 0);

    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);

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
   * @param event
   * @param node
   */
  public handleDragStart(event, node) {
    event.stopPropagation();

    this.drag.node = node;
    this.drag.expandStatus = this.treeControl.isExpanded(node);
    this.treeControl.collapse(node);
  }

  /**
   * Handle when cursor hovered over element
   * @param event
   * @param node
   */
  public handleDragOver(event, node) {
    event.preventDefault();

    if (!event.target.classList.contains('node')) {
      return;
    }

    const percentageY = Math.abs(event.offsetY / event.target.clientHeight);

    const handleAbove = percentageY >= 0 && percentageY < 0.30;
    const handleOver = percentageY >= 0.30 && percentageY <= 0.70;
    const handleBelow = percentageY > 0.70;

    if (handleAbove) {

      this.drag.expandOverArea = 'above';

    } else if (handleOver) {

      this.expandNode(node);

      this.drag.expandOverArea = 'center';

    } else if (handleBelow) {

      this.drag.expandOverArea = 'below';

    }

    if (handleBelow && isExpandable(node)) {
      this.drag.expandOverArea = null;
    }

    this.drag.expandOverNode = node;
  }


  /**
   * Drop
   * @param event
   * @param node
   */
  public handleDrop(event, node) {
    event.preventDefault();

    if (node === this.drag.node) {
      return;
    }

    const targetNode = this.flatNodeMap.get(node);
    const dragNode = this.flatNodeMap.get(this.drag.node);

    if (this.config.dropStart) {
      const toParent = this.drag.expandOverArea === 'above' || this.drag.expandOverArea === 'below'
        ? this.drag.expandOverNode.parent
        : this.drag.expandOverNode;

      const canDrop = this.config.dropStart(this.drag.node, this.drag.node.parent, toParent);

      if (canDrop instanceof Observable) {
        this.lockTree();

        canDrop.subscribe((result) => {
          if (result) {
            this.dropNode(targetNode, dragNode);
          }
          this.unlockTree();
        })
      } else if (canDrop) {
        this.dropNode(targetNode, dragNode);
      }
    } else {
      this.dropNode(targetNode, dragNode);
    }

    this.handleDragEnd();
  }

  /**
   * Drag end
   * @param event
   */
  public handleDragEnd(event = null) {
    this.drag.node = null;
    this.drag.expandOverNode = null;
    this.drag.expandOverTime = 0;
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
   * Drop logic implementation
   * @param targetNode
   * @param dragNode
   */
  private dropNode(targetNode, dragNode) {
    if (this.drag.expandOverArea === 'above') {
      this._database.insertNodeAbove(targetNode, dragNode);
    } else if (this.drag.expandOverArea === 'below') {
      this._database.insertNodeBelow(targetNode, dragNode);
    } else {
      this._database.insertNode(targetNode, dragNode);
    }
  }

  /**
   * Expand node after some time
   * @param node
   */
  private expandNode(node: FlatItemNode) {
    if (node === this.drag.expandOverNode) {
      if (this.drag.node !== node && !this.treeControl.isExpanded(node)) {
        if ((new Date().getTime() - this.drag.expandOverTime) > this.drag.expandOverWaitTime) {
          this.treeControl.expand(node);
        }
      }
    } else {
      this.drag.expandOverTime = new Date().getTime();
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
