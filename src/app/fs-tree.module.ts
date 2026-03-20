import { NgModule } from '@angular/core';

import { FsTreeComponent } from './components/tree/tree.component';
import { FsTreeNodeDirective } from './directives/tree-node.directive';
import { FsTreeHighlightPipe } from './pipes/highlight.pipe';

@NgModule({
  imports: [
    FsTreeComponent,
    FsTreeNodeDirective,
    FsTreeHighlightPipe,
  ],
  exports: [
    FsTreeComponent,
    FsTreeNodeDirective,
    FsTreeHighlightPipe,
  ],
})
export class FsTreeModule {}
