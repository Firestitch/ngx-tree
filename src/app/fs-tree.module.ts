import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  MatButtonModule,
  MatCheckboxModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatTreeModule
} from '@angular/material';
import { FsMenuModule } from '@firestitch/menu';

import { FsTreeComponent } from './components/tree/tree.component';
import { FsNodeActionsComponent } from './components/node-actions/node-actions.component';
import { FsTreeNodeDirective } from './directives/tree-node.directive';


@NgModule({
  imports: [
    CommonModule,
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
  entryComponents: [
  ],
  declarations: [
    FsTreeComponent,
    FsTreeNodeDirective,
    FsNodeActionsComponent,
  ],
  providers: [
    // FsComponentService,
  ],
})
export class FsTreeModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: FsTreeModule,
      // providers: [FsComponentService]
    };
  }
}
