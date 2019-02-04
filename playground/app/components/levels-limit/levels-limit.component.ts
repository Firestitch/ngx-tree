import { Component, ViewChild } from '@angular/core';
import { FsTreeComponent, ITreeConfig } from '@firestitch/tree';

import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { TREE_DATA } from '../../data';
import { TreeActionType } from '../../../../src/app/models/action.model';


@Component({
  selector: 'levels-limit',
  templateUrl: 'levels-limit.component.html'
})
export class LevelsLimitComponent {
  @ViewChild('tree')
  public tree: FsTreeComponent<any>;

  public config: ITreeConfig<any> = {
    data: TREE_DATA,
    changed: (data) => {
      console.log('Data was changed: ', data);
    },
    levels: 2,
    selection: false,
    childrenName: 'accounts',
    dropStart: (node, fromParent, toParent) => {
      const canDrop = fromParent === toParent || (fromParent && toParent && fromParent.level === toParent.level);
      // return canDrop;
      return of(canDrop).pipe(delay(1000))
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