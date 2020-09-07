import { Directive, Input, TemplateRef } from '@angular/core';


@Directive({
  selector: '[fsTreeNode]'
})
export class FsTreeNodeDirective {

  @Input('class')
  private _klass = '';

  constructor(private _templateRef: TemplateRef<any>) {
  }

  public get templateRef(): TemplateRef<any> {
    return this._templateRef;
  }

  public get klass(): string {
    return this._klass;
  }
}
