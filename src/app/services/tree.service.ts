import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { ItemNode } from '../models/item-node.model';
import { treeBuilder } from '../helpers/tree-builder';


@Injectable()
export class FsTreeService {

  public dataChange = new BehaviorSubject<ItemNode[]>([]);

  constructor() {}

  get data(): ItemNode[] {
    return this.dataChange.value;
  }

  public initialize(treeData: any, childrenName, maxLevel: number) {
    // Build the tree nodes from Json object. The result is a list of `ItemNode` with nested
    // file node as children.
    const data = treeBuilder(treeData, 0, null, childrenName, maxLevel);

    // Notify the change.
    this.dataChange.next(data);
  }

  public insertNodeAbove(target: ItemNode, node: ItemNode) {

    const parent = target.parent;

    this.deleteItem(node);

    if (parent) {
      const nodeIndex = parent.children.indexOf(target);
      parent.children.splice(nodeIndex, 0, node);
    } else {
      const nodeIndex = this.data.indexOf(target);
      this.data.splice(nodeIndex, 0, node);
    }

    node.parent = target.parent;

    this.dataChange.next(this.data);
  }

  public insertNodeBelow(target: ItemNode, node: ItemNode) {

    const parent = target.parent;

    this.deleteItem(node);

    if (parent) {
      const nodeIndex = parent.children.indexOf(target);
      parent.children.splice(nodeIndex + 1, 0, node);
    } else {
      const nodeIndex = this.data.indexOf(target);
      this.data.splice(nodeIndex + 1, 0, node);
    }

    node.parent = target.parent;

    this.dataChange.next(this.data);
  }

  public insertNode(target: ItemNode, node: ItemNode) {

    this.deleteItem(node);

    if (!target.children) {
      target.children = [];
    }

    target.children.push(node);

    node.parent = target;

    this.dataChange.next(this.data);
  }


  public deleteItem(node: ItemNode) {
    const parent = node.parent;

    if (parent) {
      const nodeIndex = parent.children.indexOf(node);
      parent.children.splice(nodeIndex, 1);
    } else {
      const nodeIndex = this.data.indexOf(node);
      this.data.splice(nodeIndex, 1);
    }
  }
}
