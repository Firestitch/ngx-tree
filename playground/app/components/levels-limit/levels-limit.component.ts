import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';

import { FsTreeComponent, ITreeConfig } from '@firestitch/tree';

import { TreeActionType } from '../../../../src/app/models/action.model';
import { TreeData } from '../../data';


@Component({
  selector: 'levels-limit',
  templateUrl: './levels-limit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelsLimitComponent {
  @ViewChild('tree')
  public tree: FsTreeComponent<any>;

  public config: ITreeConfig<any> = {
    data: TreeData,
    maxLevel: 2,
    childrenName: 'accounts',
    canDrop: (node, fromParent, toParent) => {
      return fromParent === toParent || (fromParent && toParent && fromParent.level === toParent.level);
    },
    changeUpdate: (data) => {
      console.log('== Update Callback', data);
    },
    changeRemove: (data) => {
      console.log('== Remove Callback', data);
    },
    changeInsert: (data) => {
      console.log('== Insert Callback', data);
    },
    changeReorder: (data) => {
      console.log('== Reorder Callback', data);
    },
    actions: [
      {
        type: TreeActionType.Menu,
        icon: 'move_vert',
        items: [
          {
            label: 'Actions Group',
            items: [
              {
                label: 'Action 1',
                click: (node) => {
                  console.log('action 1 clicked');
                },
              },
              {
                label: 'Action 2',
                click: (node) => {
                  console.log('action 2 clicked');
                },
              },
            ],
          },
          {
            label: 'Create Level 2 Object',
            show: (node) => {
              return node.level === 0;
            },
            click: (node) => {
              this.tree.append({ name: 'Level 2 Object', id: this.getRandomId(100, 999) }, node);
            },
          },
          {
            label: 'Create Object Above',
            show: (node) => {
              return node.level === 1;
            },
            click: (node) => {
              this.tree.insertAbove({ name: 'New Object', id: this.getRandomId(100, 999) }, node);
            },
          },
          {
            label: 'Create Object Below',
            show: (node) => {
              return node.level === 1;
            },
            click: (node) => {
              this.tree.insertBelow({ name: 'New Object', id: this.getRandomId(100, 999) }, node);
            },
          },
          {
            label: 'Delete',
            click: (node) => {
              this.tree.remove(node);
            },
          },
        ],

      },
    ],
  };

  public collapseAll() {
    this.tree.collapseAll();
  }

  public expandAll() {
    this.tree.expandAll();
  }

  public createRootNode() {
    this.tree.append({ name: 'Root Object', id: this.getRandomId(100, 999) });
  }

  public getRandomId(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
}
