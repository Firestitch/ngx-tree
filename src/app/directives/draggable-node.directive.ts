import {
  AfterViewInit,
  ChangeDetectorRef,
  ContentChild,
  Directive,
  ElementRef, EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

import { Draggable } from './draggable';
import { FsDraggableNodeContentDirective } from './draggable-node-content.directive';
import { FsDraggableNodeTargetDirective } from './draggable-node-target.directive';
import { FsTreeService } from '../services/tree.service';
import { FlatItemNode } from '../models/flat-item-node.model';
import { IDragEnd } from '../interfaces/draggable.interface';


@Directive({
  selector: '[fsDraggableNode]',
})
export class FsDraggableNodeDirective implements OnInit, AfterViewInit, OnDestroy {

  @Input('fsDraggableNode')
  public node: FlatItemNode;

  @Output()
  public drop = new EventEmitter<IDragEnd>();

  @ContentChild(FsDraggableNodeContentDirective, { read: ElementRef })
  public draggableContent: ElementRef;

  @ContentChild(FsDraggableNodeTargetDirective, { read: ElementRef })
  public draggableTarget: ElementRef;

  private _draggable: Draggable;

  constructor(
    private _db: FsTreeService,
    private _el: ElementRef,
    private _cdRef: ChangeDetectorRef,
    private _zone: NgZone
  ) {

  }

  public ngOnInit() {
    this._draggable = new Draggable(
      this.draggableContent,
      this.draggableTarget,
      this._cdRef,
      this._zone,
      this._db.nestedNodeMap
    );
  }

  public ngAfterViewInit() {
    const node = this._db.flatNodeMap.get(this.node);

    if (node) {
      const flatNode = this._db.nestedNodeMap.get(node);
      flatNode.el = this._el.nativeElement;
    }
  }

  public ngOnDestroy() {
    this._draggable.destroy();
  }
}
