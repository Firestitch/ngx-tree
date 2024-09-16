import { ElementRef, Injectable, OnDestroy } from '@angular/core';

import { FlatTreeControl } from '@angular/cdk/tree';

import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { FsTreeChange } from '../enums/tree-change.enum';
import { treeBuilder } from '../helpers/tree-builder';
import { sortDataBy, treeSort } from '../helpers/tree-sort';
import { ITreeConfig } from '../interfaces/config.interface';
import { ITreeDataChange } from '../interfaces/tree-data-change.interface';
import { FlatItemNode } from '../models/flat-item-node.model';
import { ItemNode } from '../models/item-node.model';


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

  public get dataChange(): Observable<ITreeDataChange> {
    return this._dataChange.asObservable();
  }

  public get data(): ItemNode[] {
    return this._data$.getValue();
  }

  public set data(value: ItemNode[]) {
    this._data$.next(value);
  }

  public get data$(): Observable<ItemNode[]> {
    return this._data$.asObservable();
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
      config.maxLevel,
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
      this._config.maxLevel,
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
    const level = parent ? parent.level + 1 : 0;
    const original = treeBuilder(data, level, parent, this._config.childrenName);
    const levelName = this._config.levelName ? this._config.levelName(level) : null;

    return new FlatItemNode({
      data,
      original,
      parent,
      originalParent: parent ? parent.original : null,
      level,
      levelName,
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
      type,
      payload,
    });
  }
}
