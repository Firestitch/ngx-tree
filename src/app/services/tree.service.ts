import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { ItemNode } from '../models/item-node.model';
import { FlatItemNode } from '../models/flat-item-node.model';
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

  public changeData() {
    this.dataChange.next(this.data);
  }

  // Create new fresh node which is ready to be insterted into tree
  public createNode(data: any, parent: FlatItemNode = null) {
    const node = new ItemNode({
      data: data,
      parent: parent
    });

    const flatNode = new FlatItemNode({
      data: data,
      original: node,
      parent: parent,
      originalParent: parent ? parent.original : null,
      level: parent ? parent.level + 1 : 0
    });

    return flatNode;
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
