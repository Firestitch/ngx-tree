import { ChangeDetectionStrategy, Component, ViewChild, inject } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import { FlatItemNode, FsTreeComponent, ITreeConfig, TreeDragMode } from '@firestitch/tree';

import { TreeActionType } from '../../../../src/app/models/action.model';
import { TreeData } from '../../data';

import { EditDialogComponent } from './edit-dialog';
import { MatButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { FsTreeComponent as FsTreeComponent_1 } from '../../../../src/app/components/tree/tree.component';
import { FsTreeNodeDirective } from '../../../../src/app/directives/tree-node.directive';


@Component({
    selector: 'actions',
    templateUrl: './actions.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatButton,
        MatButtonToggleGroup,
        MatButtonToggle,
        FsTreeComponent_1,
        FsTreeNodeDirective,
    ],
})
export class ActionsComponent {
  private _dialog = inject(MatDialog);

  @ViewChild('tree')
  public tree: FsTreeComponent<any>;

  public TreeDragMode = TreeDragMode;
  public dragMode: TreeDragMode = TreeDragMode.Handle;

  public config: ITreeConfig<any> = {
    data: TreeData,
    dragMode: TreeDragMode.Handle,
    childrenName: 'accounts',
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

  public dragModeChange(dragMode: TreeDragMode) {
    this.dragMode = dragMode;
    this.tree.setDragMode(dragMode);
  }

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
