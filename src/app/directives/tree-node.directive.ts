import { Directive, Input, TemplateRef, inject } from '@angular/core';

import { FlatItemNode } from '../models';


@Directive({
    selector: '[fsTreeNode]',
    standalone: true,
})
export class FsTreeNodeDirective {
  private _templateRef = inject<TemplateRef<any>>(TemplateRef);


  @Input('class')
  private _klass = '';

  public get templateRef(): TemplateRef<any> {
    return this._templateRef;
  }

  public get klass(): string {
    return this._klass;
  }
  
  public static ngTemplateContextGuard(
    dir: FsTreeNodeDirective,
    context: unknown,
  ): context is { 
    index: number, 
    level: number, 
    levelName: string, 
    last: boolean,
    first: boolean,
    parent: FlatItemNode,
    node: FlatItemNode,
    data: any,
  } {
    return true;
  }
}
