import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';

import { FsTreeService } from '../../services/tree.service';
import { ItemNode } from '../../models/item-node.model';
import { FlatItemNode } from '../../models/flat-item-node.model';
import { getLevel } from '../../helpers/get-level';
import { isExpandable } from '../../helpers/is-expandable';
import { getChildren } from '../../helpers/get-children';


@Component({
  selector: 'fs-tree',
  templateUrl: 'tree.component.html',
  styleUrls: [ 'tree.component.scss' ],
  providers: [ FsTreeService ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FsComponentComponent {

  @ViewChild('emptyItem')
  public emptyItem: ElementRef;

  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  public flatNodeMap = new Map<FlatItemNode, ItemNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  public nestedNodeMap = new Map<ItemNode, FlatItemNode>();

  /** A selected parent node to be inserted */
  public selectedParent: FlatItemNode | null = null;

  /** The new item's name */
  public newItemName = '';

  public treeControl: FlatTreeControl<FlatItemNode>;

  public treeFlattener: MatTreeFlattener<ItemNode, FlatItemNode>;

  public dataSource: MatTreeFlatDataSource<ItemNode, FlatItemNode>;

  /** The selection for checklist */
  public checklistSelection = new SelectionModel<FlatItemNode>(true /* multiple */);

  /* Drag and drop */
  public drag = {
    node: null,
    expandOverWaitTime: 300,
    expandOverTime: null,
    expandOverArea: null,
    expandOverNode: null,
    expandStatus: false
  };

  constructor(private _database: FsTreeService) {
    this.treeFlattener = new MatTreeFlattener(this.transformer, getLevel, isExpandable, getChildren);
    this.treeControl = new FlatTreeControl<FlatItemNode>(getLevel, isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    _database.dataChange.subscribe(data => {
      this.dataSource.data = [];
      this.dataSource.data = data;
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
    const flatNode = existingNode && existingNode.item === node.item
      ? existingNode
      : new FlatItemNode();

    flatNode.item = node.item;
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

    if (node !== this.drag.node) {

      const targetNode = this.flatNodeMap.get(node);
      const dragNode = this.flatNodeMap.get(this.drag.node);

      if (this.drag.expandOverArea === 'above') {
        this._database.insertNodeAbove(targetNode, dragNode);
      } else if (this.drag.expandOverArea === 'below') {
        this._database.insertNodeBelow(targetNode, dragNode);
      } else {
        this._database.insertNode(targetNode, dragNode);
      }
    }

    this.drag.node = null;
    this.drag.expandOverNode = null;
    this.drag.expandOverTime = 0;
  }

  /**
   * Drag end
   * @param event
   */
  public handleDragEnd(event) {
    this.drag.node = null;
    this.drag.expandOverNode = null;
    this.drag.expandOverTime = 0;
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
}
