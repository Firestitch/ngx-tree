import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatTreeModule } from '@angular/material/tree';

import { FsMenuModule } from '@firestitch/menu';

import { FsTreeComponent } from './components/tree/tree.component';
import { FsNodeActionsComponent } from './components/node-actions/node-actions.component';
import { FsTreeNodeDirective } from './directives/tree-node.directive';
import { FsDraggableNodeDirective } from './directives/draggable-node.directive';
import { FsDraggableNodeTargetDirective } from './directives/draggable-node-target.directive';
import { FsDraggableNodeContentDirective } from './directives/draggable-node-content.directive';


@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTreeModule,
    FsMenuModule,
  ],
  exports: [
    FsTreeComponent,
    FsTreeNodeDirective,
  ],
  declarations: [
    FsTreeComponent,
    FsTreeNodeDirective,
    FsNodeActionsComponent,
    FsDraggableNodeDirective,
    FsDraggableNodeContentDirective,
    FsDraggableNodeTargetDirective
  ],
  providers: [
    // FsComponentService,
  ],
})
export class FsTreeModule {}
