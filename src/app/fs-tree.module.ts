import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTreeModule } from '@angular/material/tree';

import { FsFilterModule } from '@firestitch/filter';
import { FsMenuModule } from '@firestitch/menu';

import { FsNodeActionsComponent } from './components/node-actions/node-actions.component';
import { FsTreeComponent } from './components/tree/tree.component';
import { FsDraggableNodeContentDirective } from './directives/draggable-node-content.directive';
import { FsDraggableNodeTargetDirective } from './directives/draggable-node-target.directive';
import { FsDraggableNodeDirective } from './directives/draggable-node.directive';
import { FsTreeNodeClassDirective } from './directives/tree-node-class.directive';
import { FsTreeNodeDirective } from './directives/tree-node.directive';


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
    FsFilterModule,
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
    FsDraggableNodeTargetDirective,
    FsTreeNodeClassDirective,
  ],
})
export class FsTreeModule {}
