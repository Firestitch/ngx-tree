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

import { FsComponentComponent } from './components/tree/tree.component';

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
    FsComponentComponent,
  ],
  entryComponents: [
  ],
  declarations: [
    FsComponentComponent,
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
