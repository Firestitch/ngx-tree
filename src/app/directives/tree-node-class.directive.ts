import { Directive, ElementRef, OnDestroy, OnInit } from '@angular/core';

import { MatTreeNode } from '@angular/material/tree';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FlatItemNode } from '../models/flat-item-node.model';
import { FsTreeService } from '../services/tree.service';


@Directive({
    selector: '[fsTreeNodeClass]',
    standalone: true,
})
export class FsTreeNodeClassDirective implements OnInit, OnDestroy {

  private _classesList: string[];
  private _destroy$ = new Subject<void>();

  constructor(
    private _node: MatTreeNode<FlatItemNode>,
    private _tree: FsTreeService<unknown>,
    private _el: ElementRef,
  ) {
  }

  public ngOnInit() {
    if (this._node && this._tree.config.nodeClass) {
      this._updateClasses();
      this._listenClassesUpdateRequest();
    }
  }

  public ngOnDestroy() {
    this._destroy$.next(null);
    this._destroy$.complete();
  }

  private _listenClassesUpdateRequest() {
    this._tree.updateClasses$
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        this._updateClasses();
      });
  }

  private _updateClasses() {
    let classesList = this._tree.config.nodeClass(this._node.data);

    if (!Array.isArray(classesList)) {
      classesList = classesList.split(' ');
    }

    if (this._classesListsAreSame(this._classesList, classesList)) {
      return;
    }

    requestAnimationFrame(() => {
      if (this._classesList) {
        this._el.nativeElement.classList.remove(...this._classesList);
      }

      this._el.nativeElement.classList.add(...classesList);
      this._classesList = classesList;
    });
  }

  private _classesListsAreSame(clsList1: string[], clsList2: string[]): boolean {
    if (clsList1?.length !== clsList2?.length) {
      return false; 
    }

    return !clsList1.every((cls, index) => {
      return cls === clsList2[index];
    });
  }
}
