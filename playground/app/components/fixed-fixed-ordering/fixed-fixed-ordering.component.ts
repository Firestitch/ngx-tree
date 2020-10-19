import { Component, ViewChild } from '@angular/core';
import { FsTreeComponent, ITreeConfig } from '@firestitch/tree';

import { TREE_DATA } from '../../data';
import { TreeActionType } from '../../../../src/app/models/action.model';


@Component({
  selector: 'fixed-fixed-ordering',
  templateUrl: 'fixed-fixed-ordering.component.html'
})
export class FixedFixedOrderingComponent {
  @ViewChild('tree')
  public tree: FsTreeComponent<any>;

  public config: ITreeConfig<any> = {
    data: TREE_DATA,
    levels: 2,
    selection: false,
    childrenName: 'accounts',
    nodeClass: (node) => {
      if (node.level === 0) {
        return ['my-class-0', 'level-0'];
      } else if (node.level === 1) {
        return 'my-class-1 level-1';
      } else {
        return ['my-class-other', 'level-other'];
      }
    },
    changed: (data) => {
      console.log('Data was changed: ', data);
    },
    sortBy: (data) => {
      return data.sort((a, b) => {
        if (a.id < b.id) { return -1; }
        if (b.id < b.id) { return 1; }

        return 0;
      });
    },
    canDrag: (node) => {
      return node.level > 0;
    },
    canDrop: (node, fromParent, toParent, dropPosition, prevElem, nextElem) => {
      const cantDropToRootLevel = !!toParent; // should be not equal null

      // Sorting Rule
      const prevElSortCoimplied = prevElem && prevElem.data.id < node.data.id || !prevElem;
      const nextElSortCoimplied = nextElem && node.data.id < nextElem.data.id || !nextElem;
      const compliedWithSort = prevElSortCoimplied && nextElSortCoimplied;

      return compliedWithSort && cantDropToRootLevel;
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
              this.tree.append({ name: 'Level 2 Object', id: this.getRandomId(100, 999) }, node)
            }
          },
          {
            label: 'Create Object Above',
            show: (node) => {
              return node.level === 1;
            },
            click: (node) => {
              this.tree.insertAbove({ name: 'New Object', id: this.getRandomId(100, 999) }, node)
            }
          },
          {
            label: 'Create Object Below',
            show: (node) => {
              return node.level === 1;
            },
            click: (node) => {
              this.tree.insertBelow({ name: 'New Object', id: this.getRandomId(100, 999) }, node)
            }
          },
          {
            label: 'Delete',
            click: (node) => {
              this.tree.remove(node)
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
    this.tree.append({ name: 'Root Object', id: this.getRandomId(100, 999) })
  }

  private getRandomId(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
}
