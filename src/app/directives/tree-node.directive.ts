import { Directive, Input, TemplateRef } from '@angular/core';

import { FlatItemNode } from '../models';


@Directive({
  selector: '[fsTreeNode]',
})
export class FsTreeNodeDirective {

  @Input('class')
  private _klass = '';

  constructor(
    private _templateRef: TemplateRef<any>,
  ) {
  }

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
    id: any, 
    name: string, 
    index: number, 
    level: number, 
    last: boolean,
    first: boolean,
    parent: FlatItemNode,
    node: FlatItemNode,
    data: any,
  } {
    return true;
  }
}
