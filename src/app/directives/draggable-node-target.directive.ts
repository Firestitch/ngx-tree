import { Directive, HostBinding } from '@angular/core';

@Directive({
  selector: '[fsDraggableNodeTarget]',
})
export class FsDraggableNodeTargetDirective {

  @HostBinding('class.fs-tree-draggable-target')
  public draggableTarget = true;

}
