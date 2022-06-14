import { ElementRef, Injectable, OnDestroy } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';

import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ItemNode } from '../models/item-node.model';
import { FlatItemNode } from '../models/flat-item-node.model';
import { treeBuilder } from '../helpers/tree-builder';
import { sortDataBy, treeSort } from '../helpers/tree-sort';
import { ITreeDataChange } from '../interfaces/tree-data-change.interface';
import { ITreeConfig } from '../interfaces/config.interface';
import { FsTreeChange } from '../enums/tree-change.enum';


@Injectable()
export class FsTreeDatabaseService<T> implements OnDestroy {

  public containerElement: ElementRef;

  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  public flatNodeMap = new Map<FlatItemNode, ItemNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  public nestedNodeMap = new Map<ItemNode, FlatItemNode>();

  public treeControl: FlatTreeControl<FlatItemNode>;

  private _data$ = new BehaviorSubject<ItemNode[]>([]);
  private _config: ITreeConfig<T>;
  private _dataChange = new Subject<ITreeDataChange>();
  private _destroy$ = new Subject<void>();

  constructor() {}

  get dataChange(): Observable<ITreeDataChange> {
    return this._dataChange.asObservable();
  }

  get data(): ItemNode[] {
    return this._data$.getValue();
  }

  get data$(): Observable<ItemNode[]> {
    return this._data$.asObservable();
  }

  set data(value: ItemNode[]) {
    this._data$.next(value);
  }

  public ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public initialize(
    treeControl: FlatTreeControl<FlatItemNode>,
    config: ITreeConfig<T>,
  ) {
    this.treeControl = treeControl;
    this._config = config;
    // Build the tree nodes from Json object. The result is a list of `ItemNode` with nested
    // file node as children.
    this.data = treeBuilder(
      config.data,
      0,
      null,
      config.childrenName,
      config.levels
    );

    this.data = treeSort(this.data, config.sortBy);

    // Notify the change.
    this.updateData(FsTreeChange.Init, this.data);
  }

  public setData(data: unknown): void {
    this.data = treeBuilder(
      data,
      0,
      null,
      this._config.childrenName,
      this._config.levels
    );

    this.data = treeSort(this.data, this._config.sortBy);

    // Notify the change.
    this.updateData(FsTreeChange.UpdateData, this.data);
  }

  public updateSort(target: ItemNode = null) {
    if (target && target.children) {
      target.children = treeSort(target.children, this._config.sortBy);
    } else {
      this.data = treeSort(this.data, this._config.sortBy);
    }
  }

  // Create new fresh node which is ready to be insterted into tree
  public createNode(data: any, parent: FlatItemNode = null): FlatItemNode {
    const forLevel = parent ? parent.level + 1 : 0;
    const node = treeBuilder(data, forLevel, parent, this._config.childrenName);

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

    let insertedIndex = null;

    if (parent) {
      const targetIndex = parent.children.indexOf(target);
      parent.children.splice(targetIndex, 0, node);
      parent.children = sortDataBy(parent.children, this._config.sortBy, parent);
      insertedIndex = parent.children.indexOf(node);
    } else {
      const targetIndex = this.data.indexOf(target);
      this.data.splice(targetIndex, 0, node);
      this.data = sortDataBy(this.data, this._config.sortBy);
      insertedIndex = this.data.indexOf(node);
    }

    node.parent = target.parent;

    return insertedIndex;
  }

  public insertNodeBelow(target: ItemNode, node: ItemNode): number {

    const parent = target.parent;

    this.removeItem(node);

    let insertedIndex = null;
    if (parent) {
      const targetIndex = parent.children.indexOf(target);
      parent.children.splice(targetIndex + 1, 0, node);
      parent.children = sortDataBy(parent.children, this._config.sortBy, parent);

      insertedIndex = parent.children.indexOf(node);
    } else {
      const targetIndex = this.data.indexOf(target);
      this.data.splice(targetIndex + 1, 0, node);
      this.data = sortDataBy(this.data, this._config.sortBy);

      insertedIndex = this.data.indexOf(node);
    }

    node.parent = target.parent;

    return insertedIndex;
  }

  public insertNode(target: ItemNode, node: ItemNode) {

    this.removeItem(node);

    let insertedIndex = null;
    if (target) {
      if (!target.children) {
        target.children = [];
      }

      target.children.push(node);

      node.parent = target;

      target.children = sortDataBy(target.children, this._config.sortBy, target);

      insertedIndex = target.children.indexOf(node);
    } else {
      this.data.push(node);

      this.data = sortDataBy(this.data, this._config.sortBy);
      insertedIndex = this.data.indexOf(node);
    }

    return insertedIndex;
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
