import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ItemNode } from '../models/item-node.model';
import { FlatItemNode } from '../models/flat-item-node.model';
import { treeBuilder } from '../helpers/tree-builder';


@Injectable()
export class FsTreeService implements OnDestroy {

  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  public flatNodeMap = new Map<FlatItemNode, ItemNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  public nestedNodeMap = new Map<ItemNode, FlatItemNode>();

  private _dataChange = new BehaviorSubject<ItemNode[]>([]);
  private _destroy$ = new Subject<void>();

  constructor() {}

  get dataChange(): Observable<ItemNode[]> {
    return this._dataChange.pipe(takeUntil(this._destroy$));
  }

  get data(): ItemNode[] {
    return this._dataChange.value;
  }

  public ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public initialize(treeData: any, childrenName, maxLevel: number) {
    // Build the tree nodes from Json object. The result is a list of `ItemNode` with nested
    // file node as children.
    const data = treeBuilder(treeData, 0, null, childrenName, maxLevel);

    // Notify the change.
    this._dataChange.next(data);
  }

  public changeData() {
    this._dataChange.next(this.data);
  }

  // Create new fresh node which is ready to be insterted into tree
  public createNode(data: any, parent: FlatItemNode = null) {
    const node = new ItemNode({
      data: data,
      parent: parent
    });

    return new FlatItemNode({
      data: data,
      original: node,
      parent: parent,
      originalParent: parent ? parent.original : null,
      level: parent ? parent.level + 1 : 0
    });
  }

  public insertNodeAbove(target: ItemNode, node: ItemNode) {

    const parent = target.parent;

    this.removeItem(node);

    if (parent) {
      const nodeIndex = parent.children.indexOf(target);
      parent.children.splice(nodeIndex, 0, node);
    } else {
      const nodeIndex = this.data.indexOf(target);
      this.data.splice(nodeIndex, 0, node);
    }

    node.parent = target.parent;

    this.changeData();
  }

  public insertNodeBelow(target: ItemNode, node: ItemNode) {

    const parent = target.parent;

    this.removeItem(node);

    if (parent) {
      const nodeIndex = parent.children.indexOf(target);
      parent.children.splice(nodeIndex + 1, 0, node);
    } else {
      const nodeIndex = this.data.indexOf(target);
      this.data.splice(nodeIndex + 1, 0, node);
    }

    node.parent = target.parent;

    this.changeData();
  }

  public insertNode(target: ItemNode, node: ItemNode) {

    this.removeItem(node);

    if (target) {
      if (!target.children) {
        target.children = [];
      }

      target.children.push(node);

      node.parent = target;
    } else {
      this.data.push(node);
    }

    this.changeData();
  }


  public removeItem(node: ItemNode) {
    const parent = node.parent;

    if (parent && parent.children) {
      const nodeIndex = parent.children.indexOf(node);
      if (nodeIndex > -1) {
        parent.children.splice(nodeIndex, 1);
      }
    } else {
      const nodeIndex = this.data.indexOf(node);
      if (nodeIndex > -1) {
        this.data.splice(nodeIndex, 1);
      }
    }
  }
}
