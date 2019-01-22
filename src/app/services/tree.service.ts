import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { TodoItemNode, TREE_DATA } from '../models';


@Injectable()
export class FsTreeService {

  public dataChange = new BehaviorSubject<TodoItemNode[]>([]);

  constructor() {
    this.initialize();
  }

  get data(): TodoItemNode[] {
    return this.dataChange.value;
  }

  public initialize() {
    // Build the tree nodes from Json object. The result is a list of `TodoItemNode` with nested
    //     file node as children.
    const data = this.buildFileTree(TREE_DATA, 0);

    // Notify the change.
    this.dataChange.next(data);
  }

  /**
   * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
   * The return value is the list of `TodoItemNode`.
   */
  public buildFileTree(obj: object, level: number): TodoItemNode[] {
    return Object.keys(obj).reduce<TodoItemNode[]>((accumulator, key) => {
      const value = obj[key];
      const node = new TodoItemNode();
      node.item = key;

      if (value != null) {
        if (typeof value === 'object') {
          node.children = this.buildFileTree(value, level + 1);
        } else {
          node.item = value;
        }
      }

      return accumulator.concat(node);
    }, []);
  }

  /** Add an item to to-do list */
  public insertItem(parent: TodoItemNode, name: string): TodoItemNode {
    if (!parent.children) {
      parent.children = [];
    }
    const newItem = { item: name } as TodoItemNode;
    parent.children.push(newItem);
    this.dataChange.next(this.data);

    return newItem;
  }

  public insertItemAbove(node: TodoItemNode, name: string): TodoItemNode {
    const parentNode = this.getParentFromNodes(node);
    const newItem = { item: name } as TodoItemNode;
    if (parentNode != null) {
      parentNode.children.splice(parentNode.children.indexOf(node), 0, newItem);
    } else {
      this.data.splice(this.data.indexOf(node), 0, newItem);
    }
    this.dataChange.next(this.data);

    return newItem;
  }

  public insertItemBelow(node: TodoItemNode, name: string): TodoItemNode {
    const parentNode = this.getParentFromNodes(node);
    const newItem = { item: name } as TodoItemNode;
    if (parentNode != null) {
      parentNode.children.splice(parentNode.children.indexOf(node) + 1, 0, newItem);
    } else {
      this.data.splice(this.data.indexOf(node) + 1, 0, newItem);
    }
    this.dataChange.next(this.data);

    return newItem;
  }

  public getParentFromNodes(node: TodoItemNode): TodoItemNode {
    for (let i = 0; i < this.data.length; ++i) {
      const currentRoot = this.data[i];
      const parent = this.getParent(currentRoot, node);

      if (parent != null) {
        return parent;
      }
    }

    return null;
  }

  public getParent(currentRoot: TodoItemNode, node: TodoItemNode): TodoItemNode {
    if (currentRoot.children && currentRoot.children.length > 0) {
      for (let i = 0; i < currentRoot.children.length; ++i) {
        const child = currentRoot.children[i];

        if (child === node) {
          return currentRoot;
        } else if (child.children && child.children.length > 0) {
          const parent = this.getParent(child, node);

          if (parent != null) {
            return parent;
          }
        }
      }
    }

    return null;
  }

  public updateItem(node: TodoItemNode, name: string) {
    node.item = name;
    this.dataChange.next(this.data);
  }

  public deleteItem(node: TodoItemNode) {
    this.deleteNode(this.data, node);
    this.dataChange.next(this.data);
  }

  public copyPasteItem(from: TodoItemNode, to: TodoItemNode): TodoItemNode {
    const newItem = this.insertItem(to, from.item);
    if (from.children) {
      from.children.forEach(child => {
        this.copyPasteItem(child, newItem);
      });
    }

    return newItem;
  }

  public copyPasteItemAbove(from: TodoItemNode, to: TodoItemNode): TodoItemNode {
    const newItem = this.insertItemAbove(to, from.item);
    if (from.children) {
      from.children.forEach(child => {
        this.copyPasteItem(child, newItem);
      });
    }

    return newItem;
  }

  public copyPasteItemBelow(from: TodoItemNode, to: TodoItemNode): TodoItemNode {
    const newItem = this.insertItemBelow(to, from.item);
    if (from.children) {
      from.children.forEach(child => {
        this.copyPasteItem(child, newItem);
      });
    }

    return newItem;
  }

  public deleteNode(nodes: TodoItemNode[], nodeToDelete: TodoItemNode) {
    const index = nodes.indexOf(nodeToDelete, 0);

    if (index > -1) {
      nodes.splice(index, 1);
    } else {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          this.deleteNode(node.children, nodeToDelete);
        }
      });
    }
  }
}
