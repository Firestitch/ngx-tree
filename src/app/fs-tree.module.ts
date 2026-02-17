import { NgModule } from '@angular/core';

import { FsTreeComponent } from './components/tree/tree.component';
import { FsTreeNodeDirective } from './directives/tree-node.directive';

@NgModule({
  imports: [
    FsTreeComponent,
    FsTreeNodeDirective,
  ],
  exports: [
    FsTreeComponent,
    FsTreeNodeDirective,
  ],
})
export class FsTreeModule {}
