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

import { FsTreeComponent } from './components/tree/tree.component';
import { FsTreeNodeDirective } from './directives/tree-node.directive';

@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTreeModule
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
