import { Component, ViewChild } from '@angular/core';
import { FsTreeComponent, ITreeConfig } from '@firestitch/tree';

import { TREE_DATA } from '../../data';
import { TreeActionType } from '../../../../src/app/models/action.model';


@Component({
  selector: 'manage-fixed-ordering',
  templateUrl: 'manage-fixed-ordering.component.html'
})
export class ManageFixedOrderingComponent {
  @ViewChild('tree')
  public tree: FsTreeComponent<any>;

  public config: ITreeConfig<any> = {
    data: TREE_DATA,
    levels: 2,
    selection: false,
    childrenName: 'accounts',
    changed: (data) => {
      console.log('Data was changed: ', data);
    },
    sortBy: (data, parent) => {
      if (!parent) { return data; }

      return data.sort((a, b) => {
        if (a.id < b.id) { return -1; }
        if (b.id < b.id) { return 1; }

        return 0;
      });
    },
    canDrop: (node, fromParent, toParent, dropPosition, prevElem, nextElem) => {
      const isRoot = node.level === 0;
      const dropToSameLevel = fromParent === toParent;

      const dropToSecondLevel = toParent && toParent.level === 0;

      // Sorting Rule
      const prevElSortCoimplied = prevElem && prevElem.data.id < node.data.id || !prevElem;
      const nextElSortCoimplied = nextElem && node.data.id < nextElem.data.id || !nextElem;
      const compliedWithSort = prevElSortCoimplied && nextElSortCoimplied;

      return (isRoot && dropToSameLevel)
        || (!isRoot && !dropToSameLevel && compliedWithSort && dropToSecondLevel);
    },
    actions: [
      {
        type: TreeActionType.Menu,
        icon: 'move_vert',
        items: [
          {
            label: 'Create Level 2 Object',
            show: (node) => {
              return node.level === 0;
            },
            click: (node) => {
              this.tree.appendElement({ name: 'Level 2 Object', id: this.getRandomId(100, 999) }, node)
            }
          },
          {
            label: 'Create Object Above',
            show: (node) => {
              return node.level === 1;
            },
            click: (node) => {
              this.tree.insertElementAbove({ name: 'New Object', id: this.getRandomId(100, 999) }, node)
            }
          },
          {
            label: 'Create Object Below',
            show: (node) => {
              return node.level === 1;
            },
            click: (node) => {
              this.tree.insertElementBelow({ name: 'New Object', id: this.getRandomId(100, 999) }, node)
            }
          },
          {
            label: 'Delete',
            click: (node) => {
              this.tree.removeNode(node)
            }
          }
        ],

      }
    ]
  };

  public collapseAll() {
    this.tree.collapseAll();
  }

  public expandAll() {
    this.tree.expandAll();
  }

  public createRootNode() {
    this.tree.appendElement({ name: 'Root Object', id: this.getRandomId(100, 999) })
  }

  private getRandomId(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
}
