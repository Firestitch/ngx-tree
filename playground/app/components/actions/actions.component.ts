import { Component, ViewChild } from '@angular/core';
import { FlatItemNode, FsTreeComponent, ITreeConfig } from '@firestitch/tree';

import { TREE_DATA } from '../../data';
import { TreeActionType } from '../../../../src/app/models/action.model';
import { MatDialog } from '@angular/material/dialog';
import { EditDialogComponent } from './edit-dialog';


@Component({
  selector: 'actions',
  templateUrl: 'actions.component.html'
})
export class ActionsComponent {
  @ViewChild('tree')
  public tree: FsTreeComponent<any>;

  public config: ITreeConfig<any> = {
    data: TREE_DATA,
    maxLevel: 2,
    childrenName: 'accounts',
    sortBy: (data) => {
      return data.sort((a, b) => {
        if (a.id < b.id) { return -1; }
        if (b.id < b.id) { return 1; }

        return 0;
      });
    },
    canDrag: (node) => {
      return true;
    },
    nodeClick: ({ node }) => {
      this._edit(node);
    },
    canNodeClick: (node) => {
      return true;
    },
    actions: [
      {
        type: TreeActionType.Menu,
        icon: 'move_vert',
        items: [
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

  constructor(
    private _dialog: MatDialog,
  ) {
  }

  public collapseAll() {
    this.tree.collapseAll();
  }

  public expandAll() {
    this.tree.expandAll();
  }

  public createRootNode() {
    this.tree.append({ name: 'Root Object', id: this.getRandomId(100, 999) })
  }

  private _edit(node: FlatItemNode) {
    this._dialog
      .open(EditDialogComponent, {
        data: { node: node.data }
      })
      .afterClosed()
      .subscribe((data) => {
        if (data !== undefined) {
          this.tree.updateNodeData(data, node);
        }
      });
  }

  private getRandomId(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
}
