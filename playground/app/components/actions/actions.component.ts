import { ChangeDetectionStrategy, Component, ViewChild, inject } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import { FlatItemNode, FsTreeComponent, ITreeConfig } from '@firestitch/tree';

import { TreeActionType } from '../../../../src/app/models/action.model';
import { TreeData } from '../../data';

import { EditDialogComponent } from './edit-dialog';
import { MatButton } from '@angular/material/button';
import { FsTreeComponent as FsTreeComponent_1 } from '../../../../src/app/components/tree/tree.component';
import { FsTreeNodeDirective } from '../../../../src/app/directives/tree-node.directive';


@Component({
    selector: 'actions',
    templateUrl: './actions.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatButton,
        FsTreeComponent_1,
        FsTreeNodeDirective,
    ],
})
export class ActionsComponent {
  private _dialog = inject(MatDialog);

  @ViewChild('tree')
  public tree: FsTreeComponent<any>;

  public config: ITreeConfig<any> = {
    data: TreeData,
    maxLevel: 2,
    childrenName: 'accounts',
    sortBy: (data) => {
      return data.sort((a, b) => {
        if (a.id < b.id) {
          return -1; 
        }
        if (b.id < b.id) {
          return 1; 
        }

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

  private _edit(node: FlatItemNode) {
    this._dialog
      .open(EditDialogComponent, {
        data: { node: node.data },
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
