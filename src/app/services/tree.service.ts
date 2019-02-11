import { Injectable, OnDestroy } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';

import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ItemNode } from '../models/item-node.model';
import { FlatItemNode } from '../models/flat-item-node.model';
import { treeBuilder } from '../helpers/tree-builder';
import { FsTreeChange } from '../enums/tree-change.enum';
import { ITreeDataChange } from '../interfaces/tree-data-change.interface';


@Injectable()
export class FsTreeService implements OnDestroy {

  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  public flatNodeMap = new Map<FlatItemNode, ItemNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  public nestedNodeMap = new Map<ItemNode, FlatItemNode>();

  public treeControl: FlatTreeControl<FlatItemNode>;

  private _data: ItemNode[] = [];
  private _dataChange = new Subject<ITreeDataChange>();
  private _destroy$ = new Subject<void>();

  constructor() {}

  get dataChange(): Observable<ITreeDataChange> {
    return this._dataChange.pipe(takeUntil(this._destroy$));
  }

  get data(): ItemNode[] {
    return this._data;
  }

  public ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public initialize(
    treeControl: FlatTreeControl<FlatItemNode>,
    treeData: any,
    childrenName,
    maxLevel: number
  ) {
    this.treeControl = treeControl;
    // Build the tree nodes from Json object. The result is a list of `ItemNode` with nested
    // file node as children.
    this._data = treeBuilder(treeData, 0, null, childrenName, maxLevel);

    // Notify the change.
    this.updateData(FsTreeChange.Init, this._data);
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

  public insertNodeAbove(target: ItemNode, node: ItemNode): number {

    const parent = target.parent;

    this.removeItem(node);

    let nodeIndex = null;

    if (parent) {
      nodeIndex = parent.children.indexOf(target);
      parent.children.splice(nodeIndex, 0, node);
    } else {
      nodeIndex = this.data.indexOf(target);
      this.data.splice(nodeIndex, 0, node);
    }

    node.parent = target.parent;

    return nodeIndex;
  }

  public insertNodeBelow(target: ItemNode, node: ItemNode): number {

    const parent = target.parent;

    this.removeItem(node);

    let nodeIndex = null;
    if (parent) {
      nodeIndex = parent.children.indexOf(target);
      parent.children.splice(nodeIndex + 1, 0, node);
    } else {
      nodeIndex = this.data.indexOf(target);
      this.data.splice(nodeIndex + 1, 0, node);
    }

    node.parent = target.parent;

    return nodeIndex;
  }

  public insertNode(target: ItemNode, node: ItemNode) {

    this.removeItem(node);

    let nodeIndex = null;
    if (target) {
      if (!target.children) {
        target.children = [];
      }

      target.children.push(node);

      node.parent = target;

      nodeIndex = target.children.indexOf(node);
    } else {
      this.data.push(node);
      nodeIndex = this.data.indexOf(node);
    }

    return nodeIndex;
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

  public updateData(type: FsTreeChange, payload: any) {
    this._dataChange.next({
      type: type,
      payload: payload
    });
  }
}
