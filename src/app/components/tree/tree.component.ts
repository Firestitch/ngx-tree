import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';

import { FsTreeService } from 'src/app/services/tree.service';
import { TodoItemFlatNode, TodoItemNode } from 'src/app/models';


@Component({
  selector: 'fs-tree',
  templateUrl: 'tree.component.html',
  styleUrls: [ 'tree.component.scss' ],
  providers: [FsTreeService ]
})
export class FsComponentComponent {

  @ViewChild('emptyItem')
  public emptyItem: ElementRef;

  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  public flatNodeMap = new Map<TodoItemFlatNode, TodoItemNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  public nestedNodeMap = new Map<TodoItemNode, TodoItemFlatNode>();

  /** A selected parent node to be inserted */
  public selectedParent: TodoItemFlatNode | null = null;

  /** The new item's name */
  public newItemName = '';

  public treeControl: FlatTreeControl<TodoItemFlatNode>;

  public treeFlattener: MatTreeFlattener<TodoItemNode, TodoItemFlatNode>;

  public dataSource: MatTreeFlatDataSource<TodoItemNode, TodoItemFlatNode>;

  /** The selection for checklist */
  public checklistSelection = new SelectionModel<TodoItemFlatNode>(true /* multiple */);

  /* Drag and drop */
  public dragNode: any;
  public dragNodeExpandOverWaitTimeMs = 300;
  public dragNodeExpandOverNode: any;
  public dragNodeExpandOverTime: number;
  public dragNodeExpandOverArea: string;

  constructor(private _database: FsTreeService) {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<TodoItemFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    _database.dataChange.subscribe(data => {
      this.dataSource.data = [];
      this.dataSource.data = data;
    });
  }

  getLevel = (node: TodoItemFlatNode) => node.level;

  isExpandable = (node: TodoItemFlatNode) => node.expandable;

  getChildren = (node: TodoItemNode): TodoItemNode[] => node.children;

  hasChild = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.expandable;

  hasNoContent = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.item === '';

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: TodoItemNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode = existingNode && existingNode.item === node.item
      ? existingNode
      : new TodoItemFlatNode();
    flatNode.item = node.item;
    flatNode.level = level;
    flatNode.expandable = (node.children && node.children.length > 0);
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  };

  /** Whether all the descendants of the node are selected */
  public descendantsAllSelected(node: TodoItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    return descendants.every(child => this.checklistSelection.isSelected(child));
  }

  /** Whether part of the descendants are selected */
  public descendantsPartiallySelected(node: TodoItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some(child => this.checklistSelection.isSelected(child));
    return result && !this.descendantsAllSelected(node);
  }

  /** Toggle the to-do item selection. Select/deselect all the descendants node */
  public todoItemSelectionToggle(node: TodoItemFlatNode): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);
  }

  public handleDragStart(event, node) {
    event.stopPropagation();
    // Required by Firefox (https://stackoverflow.com/questions/19055264/why-doesnt-html5-drag-and-drop-work-in-firefox)
    //event.dataTransfer.setData('foo', 'bar');
    //event.dataTransfer.setDragImage(this.emptyItem.nativeElement, 0, 0);
    this.dragNode = node;
    //this.treeControl.collapse(node);
  }

  public handleDragOver(event, node) {
    event.preventDefault();

    // Handle node expand
    if (node === this.dragNodeExpandOverNode) {
      if (this.dragNode !== node && !this.treeControl.isExpanded(node)) {
        if ((new Date().getTime() - this.dragNodeExpandOverTime) > this.dragNodeExpandOverWaitTimeMs) {
          this.treeControl.expand(node);
        }
      }
    } else {
      this.dragNodeExpandOverNode = node;
      this.dragNodeExpandOverTime = new Date().getTime();
    }

    const percentageY = event.offsetY / event.srcElement.clientHeight;

    if (percentageY < 0.30) {
      this.dragNodeExpandOverArea = 'above';
    } else if (percentageY >= 0.30) {
      this.dragNodeExpandOverArea = 'center';
    }
  }

  public handleDrop(event, node) {
    event.preventDefault();
    if (node !== this.dragNode) {
      let newItem: TodoItemNode;
      if (this.dragNodeExpandOverArea === 'above') {
        newItem = this._database.copyPasteItemAbove(this.flatNodeMap.get(this.dragNode), this.flatNodeMap.get(node));
      } else if (this.dragNodeExpandOverArea === 'below') {
        newItem = this._database.copyPasteItemBelow(this.flatNodeMap.get(this.dragNode), this.flatNodeMap.get(node));
      } else {
        newItem = this._database.copyPasteItem(this.flatNodeMap.get(this.dragNode), this.flatNodeMap.get(node));
      }
      this._database.deleteItem(this.flatNodeMap.get(this.dragNode));
      //this.treeControl.expandDescendants(this.nestedNodeMap.get(newItem));
    }
    this.dragNode = null;
    this.dragNodeExpandOverNode = null;
    this.dragNodeExpandOverTime = 0;
  }

  public handleDragEnd(event) {
    this.dragNode = null;
    this.dragNodeExpandOverNode = null;
    this.dragNodeExpandOverTime = 0;
  }
}
