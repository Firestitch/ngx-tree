import {
  AfterViewInit,
  ChangeDetectorRef,
  ContentChild,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Draggable } from '../class/draggable';
import { FsDraggableNodeContentDirective } from './draggable-node-content.directive';
import { FsDraggableNodeTargetDirective } from './draggable-node-target.directive';
import { FlatItemNode } from '../models/flat-item-node.model';
import { IDragEnd } from '../interfaces/draggable.interface';
import { FsTreeService } from '../services/tree.service';
import { LoggerService } from '../services/logger.service';


@Directive({
  selector: '[fsDraggableNode]',
})
export class FsDraggableNodeDirective implements OnInit, AfterViewInit, OnDestroy {

  @Input('fsDraggableNode')
  public node: FlatItemNode;

  @Input('fsCanDrop')
  public candDrop: any;

  @Output()
  public dragStart = new EventEmitter<FlatItemNode>();

  @Output()
  public drop = new EventEmitter<IDragEnd>();

  @ContentChild(FsDraggableNodeContentDirective, { read: ElementRef })
  public draggableContent: ElementRef;

  @ContentChild(FsDraggableNodeTargetDirective, { read: ElementRef })
  public draggableTarget: ElementRef;

  private _draggable: Draggable;

  private _destroy = new Subject<void>();

  constructor(
    private _db: FsTreeService,
    private _logger: LoggerService,
    private _el: ElementRef,
    private _cdRef: ChangeDetectorRef,
    private _zone: NgZone,
  ) {}

  public ngOnInit() {
    this._zone.runOutsideAngular(() => {
      this._draggable = new Draggable(
        this.node,
        this.draggableContent,
        this.draggableTarget,
        this._db.nestedNodeMap,
        { canDrop: this.candDrop },
        this._logger,
      );
    });

    this._initSubscriptions();
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

    this._destroy.next();
    this._destroy.complete();
  }

  private _initSubscriptions() {
    this._draggable.dragStart$
      .pipe(
        takeUntil(this._destroy)
      )
      .subscribe(() => {
        this.dragStart.emit(this.node);
      });

    this._draggable.dragEnd$
      .pipe(
        takeUntil(this._destroy),
      )
      .subscribe((data) => {
        this.drop.emit(data);
      });
  }
}
