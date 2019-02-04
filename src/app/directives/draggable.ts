import { ChangeDetectorRef, ElementRef, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FlatItemNode } from '../models/flat-item-node.model';
import { ItemNode } from '../models/item-node.model';
import { lookupNearPoint, lower } from '../helpers/binary';
import { IDragEnd, IOrderedNode } from '../interfaces/draggable.interface';


export class Draggable {

  public dragging = false;

  // Drag
  private _dragHeight = null;
  private _dragTarget = null;
  private _draggableEl = null;
  private _droppableEl = null;
  private _dragOverEl = null;

  // Observables
  private _dragStart$ = new Subject<void>();
  private _dragEnd$ = new Subject<IDragEnd>();
  private _destroy$ = new Subject();

  // TODO refactor and fix
  private _shiftX;

  private _nodesOrderedByCoords: IOrderedNode[] = [];
  private _dragDims;

  private _dragStartHandler = this.dragStart.bind(this);
  private _moveHandler = this.dragTo.bind(this);
  private _dropHandler = this.dragEnd.bind(this);

  constructor(private _el: ElementRef,
              private _target: ElementRef,
              private _cdRef: ChangeDetectorRef,
              private _zone: NgZone,
              private _nodes: Map<ItemNode, FlatItemNode>) {

    this._el.nativeElement.addEventListener('mousedown', this._dragStartHandler);
    this._el.nativeElement.addEventListener('touchstart', this._dragStartHandler);
  }

  get dragStart$(): Observable<void> {
    return this._dragStart$.pipe(takeUntil(this._destroy$));
  }

  get dragEnd$(): Observable<IDragEnd> {
    return this._dragEnd$.pipe(takeUntil(this._destroy$));
  }


  /**
   * Prepare draggable elements and add events
   * @param event
   */
  public dragStart(event) {
    if (this.dragging) {
      event.preventDefault();
      event.stopPropagation();
      return
    }

    this.dragging = true;

    // window.document.body.classList.add('reorder-in-progress');

    this._dragTarget = event.target;

    this._dragDims = this._dragTarget.getBoundingClientRect();
    this._shiftX = event.clientX - this._dragDims.left;

    this.initDraggableElement(event);
    this.initDroppableElement(event);

    this._dragTarget.classList.add('draggable-elem');

    this._zone.runOutsideAngular(() => {
      window.document.addEventListener('mousemove', this._moveHandler);
      window.document.addEventListener('touchmove', this._moveHandler, { passive: false } as any);
      window.document.addEventListener('mouseup', this._dropHandler);
      window.document.addEventListener('touchend', this._dropHandler);
      window.document.addEventListener('touchcancel', this._dropHandler);
    });

    this.orderNodesByCoords();

    this._dragStart$.next();
  }


  /**
   * Move draggable elements and swap items
   * @param event
   */
  public dragTo(event) {
    this.touchFix(event);

    this.moveDroppable(event);

    const topOffset = (event.y || event.clientY) - (this._dragHeight / 2);
    const leftOffset = (event.x || event.pageX) - this._shiftX;

    this._draggableEl.style.top =  topOffset + 'px';
    this._draggableEl.style.left =  leftOffset + 'px';
  }

  /**
   * Remove events and classes after drag finish
   */
  public dragEnd() {
    this.dragging = false;
    const [element, isec] = this.lookupElementUnder(event);

    window.document.body.classList.remove('reorder-in-progress');
    this._dragTarget.classList.remove('draggable-elem');
    this._draggableEl.remove();
    this._droppableEl.remove();

    this._draggableEl = null;
    this._droppableEl = null;

    window.document.removeEventListener('mousemove', this._moveHandler);
    window.document.removeEventListener('touchmove', this._moveHandler);
    window.document.removeEventListener('mouseup', this._dropHandler);
    window.document.removeEventListener('touchend', this._dropHandler);
    window.document.removeEventListener('touchcancel', this._dropHandler);

    this._nodesOrderedByCoords = [];

    this._dragEnd$.next({
      node: element.node,
      dropPosition: this._getPositionByIsec(isec)
    });
  }

  /**
   * Destroy
   */
  public destroy() {
    this._el.nativeElement.removeEventListener('mousedown', this._dragStartHandler);
    this._el.nativeElement.removeEventListener('touchstart', this._dragStartHandler);

    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Init draggable element
   * @param event
   */
  private initDraggableElement(event) {
    const el = this._el.nativeElement.cloneNode(true);
    const dimentions = this._el.nativeElement.getBoundingClientRect();

    el.style.width = dimentions.width + 'px';
    el.style.left = dimentions.left + 'px';
    el.style.top = dimentions.top + 'px';

    el.classList.add('draggable');

    this._el.nativeElement.append(el);

    this._draggableEl = el;
    this._dragHeight = dimentions.height;
  }

  /**
   * Init droppable element
   * @param event
   */
  private initDroppableElement(event) {
    const droppableEl = document.createElement('div');
    const dimensions = this._el.nativeElement.getBoundingClientRect();

    droppableEl.style.display = 'none';
    droppableEl.style.width = dimensions.width + 'px';

    droppableEl.classList.add('droppable');

    this._el.nativeElement.append(droppableEl);

    this._droppableEl = droppableEl;
  }

  private moveDroppable(event: MouseEvent | TouchEvent) {
    const [element, isec] = this.lookupElementUnder(event);
    const position = this._getPositionByIsec(isec);

    if (this._dragOverEl && element.node !== this._dragOverEl) {
      this._dragOverEl.el.classList.remove('drop-into');
      this._dragOverEl = null;
    }

    const droppableEl = this._droppableEl;

    switch (position) {
      case 'above': {
        droppableEl.style.display = 'block';
        element.node.el.classList.remove('drop-into');

        const top = element.dimentions.top - 5;
        droppableEl.style.top = top + 'px';
      } break;

      case 'center': {
        element.node.el.classList.add('drop-into');
        droppableEl.style.display = 'none';

        this._dragOverEl = element.node;
      } break;

      case 'below': {
        droppableEl.style.display = 'block';
        element.node.el.classList.remove('drop-into');

        const top = element.dimentions.top + element.dimentions.height - 5;
        droppableEl.style.top = top + 'px';
      } break;
    }
  }

  private _getPositionByIsec(isec) {
    if (isec < 0.20) {
      return 'below';
    } else if (isec > 0.80) {
      return 'above';
    } else {
      return 'center';
    }
  }

  /**
   * Looking by ordered elements element which under draggable
   * @param event
   */
  private lookupElementUnder(event): [ IOrderedNode, number] {
    const y = event.y || event.clientY;

    const topOffset = y;
    const halfOfDragHeight = this._dragHeight / 2;

    const elIndex = lookupNearPoint(
      this._nodesOrderedByCoords,
      topOffset,
      (node) => node.dimentions.y + halfOfDragHeight
    );

    const el = this._nodesOrderedByCoords[elIndex];

    if (el) {

      const draggableRect = {
        x1: this._dragDims.x,
        x2: this._dragDims.x + this._dragDims.width,
        y1: y,
        y2: y + this._dragDims.height,
      };

      const rectUnder = {
        x1: el.dimentions.x,
        x2: el.dimentions.x + el.dimentions.width,
        y1: el.dimentions.y,
        y2: el.dimentions.y + el.dimentions.height,
      };

      const isec = this.calcRectIntersection(
        rectUnder.y1,
        rectUnder.y2,
        draggableRect.y1,
        draggableRect.y2,
      );

      return [el, isec]
    }

    return null;
  }

  /**
   * Calculate intersection of rectangles
   * @param y11
   * @param y12
   * @param y21
   * @param y22
   */
  private calcRectIntersection(y11: number, y12: number, y21: number, y22: number) {

    if (y21 > y12) { return 0; }
    if (y22 < y12) { return 1; }

    const y1Isec = Math.max(y11, y21);
    const y2Isec = Math.min(y12, y22);

    const intersectionArea = y2Isec - y1Isec;

    const rect1Area = y12 - y11;

    return intersectionArea / rect1Area;
  }

  /**
   * Fix background when mobile
   * @param e
   */
  private touchFix(e) {
    if (!('clientX' in e) && !('clientY' in e)) {
      const touches = e.touches || e.originalEvent.touches;
      if (touches && touches.length) {
        e.clientX = touches[0].clientX;
        e.clientY = touches[0].clientY;
      }

      e.preventDefault();
    }
  }

  private orderNodesByCoords() {
    this._nodes.forEach((node) => {
      if (node.el) {
        const dimentions = node.el.getBoundingClientRect();
        const insertIndex = lower(this._nodesOrderedByCoords, dimentions.y, (item) => item.dimentions.y);

        this._nodesOrderedByCoords.splice(
          insertIndex,
          0,
          { dimentions: dimentions, node: node }
          );
      }
    });
  }
}
