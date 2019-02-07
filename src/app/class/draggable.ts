import { ElementRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Droppable } from './droppable';

import { FlatItemNode } from '../models/flat-item-node.model';
import { ItemNode } from '../models/item-node.model';
import { IDragEnd } from '../interfaces/draggable.interface';


export class Draggable {

  public dragging = false;

  private _droppable: Droppable;

  // Drag
  // Draggable target from event.target when drag started
  private _dragTarget: HTMLDivElement = null;
  // Draggable HTML node (copy from dragTarget)
  private _draggableEl: HTMLDivElement = null;

  // Observables
  private _dragStart$ = new Subject<void>();
  private _dragEnd$ = new Subject<IDragEnd>();
  private _expandNode$ = new Subject<FlatItemNode>();
  private _destroy$ = new Subject();

  // Shift for align element under correct cursor position
  private _shiftX;

  // Dimentions for dragTarget for future calculations
  private _dragDims;

  // Handlers for remove listeners in feature
  private _dragStartHandler = this.dragStart.bind(this);
  private _moveHandler = this.dragTo.bind(this);
  private _dropHandler = this.dragEnd.bind(this);

  /**
   * Class for control mouse/touch drag
   * @param _node
   * @param _el
   * @param _target
   * @param _nodes
   * @param _restrictions
   */
  constructor(
    private _node: FlatItemNode,
    private _el: ElementRef,
    private _target: ElementRef,
    private _nodes: Map<ItemNode, FlatItemNode>,
    private _restrictions: any
  ) {

    // Listen mouse or touch events
    this._target.nativeElement.addEventListener('mousedown', this._dragStartHandler);
    this._target.nativeElement.addEventListener('touchstart', this._dragStartHandler);

    this._subscribe();
  }

  get dragStart$(): Observable<void> {
    return this._dragStart$.pipe(takeUntil(this._destroy$));
  }

  get dragEnd$(): Observable<IDragEnd> {
    return this._dragEnd$.pipe(takeUntil(this._destroy$));
  }

  get expandNode$(): Observable<FlatItemNode> {
    return this._expandNode$.pipe(takeUntil(this._destroy$));
  }


  /**
   * Prepare draggable elements and add events
   * @param event
   */
  public dragStart(event) {

    this._dragStart$.next();

    this._hideChildrenNodes(this._node);

    // If already dragging cancel event
    if (this.dragging) {
      event.preventDefault();
      event.stopPropagation();
      return
    }

    this.dragging = true;

    window.document.body.classList.add('block-selection');

    this._dragTarget = event.target;

    this._dragDims = this._el.nativeElement.getBoundingClientRect();
    this._shiftX = event.clientX - this._dragDims.left;

    this._initDraggableElement(event);

    this._droppable = new Droppable(
      this._node,
      this._el,
      this._draggableEl,
      this._nodes,
      this._dragDims,
      this._expandNode$,
      this._restrictions.canDrop
    );

    this._droppable.shift((event.x || event.clientX) - this._dragDims.left);

    this._node.el.classList.add('draggable-elem');

    window.document.addEventListener('mousemove', this._moveHandler);
    window.document.addEventListener('touchmove', this._moveHandler, { passive: false } as any);
    window.document.addEventListener('mouseup', this._dropHandler);
    window.document.addEventListener('touchend', this._dropHandler);
    window.document.addEventListener('touchcancel', this._dropHandler);

    this._dragStart$.next();
  }


  /**
   * Move draggable elements and swap items
   * @param event
   */
  public dragTo(event) {
    this._touchFix(event);

    this._droppable.moveDroppable(event);

    const topOffset = (event.y || event.clientY) - (this._dragDims.height / 2);
    const leftOffset = (event.x || event.pageX) - this._shiftX;

    this._draggableEl.style.top =  topOffset + 'px';
    this._draggableEl.style.left =  leftOffset + 'px';
  }

  /**
   * Remove events and classes after drag finish
   */
  public dragEnd() {
    this.dragging = false;

    window.document.removeEventListener('mousemove', this._moveHandler);
    window.document.removeEventListener('touchmove', this._moveHandler);
    window.document.removeEventListener('mouseup', this._dropHandler);
    window.document.removeEventListener('touchend', this._dropHandler);
    window.document.removeEventListener('touchcancel', this._dropHandler);

    // console.log(this._droppable.dropTarget.node, this._droppable.dropPosition, this._droppable.dropLevel);
    if (this._droppable.dropTarget && this._droppable.dropPosition) {
      this._dragEnd$.next({
        node: this._node,
        dropInto: this._droppable.dropTarget,
        dropPosition: this._droppable.dropPosition,
      });
    }

    this._showChildrenNodes(this._node);

    window.document.body.classList.remove('block-selection');
    this._node.el.classList.remove('draggable-elem');

    this._draggableEl.remove();
    this._droppable.destroy();

    this._droppable = null;
    this._draggableEl = null;
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
   * Subscribe to events
   * @private
   */
  private _subscribe() {
    this._expandNode$
      .pipe(takeUntil(this._destroy$))
      .subscribe((node) => {
        if (this._node !== node) {
          this._showChildrenNodes(node);
        }
      })
  }

  /**
   * Init draggable element
   * @param event
   */
  private _initDraggableElement(event) {
    const el = this._el.nativeElement.cloneNode(true);
    const dimentions = this._el.nativeElement.getBoundingClientRect();

    el.style.width = dimentions.width + 'px';
    el.style.left = dimentions.left + 'px';
    el.style.top = dimentions.top + 'px';

    el.classList.add('draggable-item');

    this._el.nativeElement.append(el);

    this._draggableEl = el;
  }

  // Mark all children nodes as hidden = false
  private _showChildrenNodes(node: FlatItemNode) {
    if (node.original.children) {
      node.original.children.forEach((child) => {
        const childNode = this._nodes.get(child);
        childNode.hidden = false;
        this._showChildrenNodes(childNode);
      });
    }
  }

  // Mark all children nodes as hidden
  private _hideChildrenNodes(node: FlatItemNode) {
    if (node.original.children) {
      node.original.children.forEach((child) => {
        const childNode = this._nodes.get(child);
        childNode.hidden = true;
        this._hideChildrenNodes(childNode);
      });
    }
  }

  /**
   * Fix background when mobile
   * @param e
   */
  private _touchFix(e) {
    if (!('clientX' in e) && !('clientY' in e)) {
      const touches = e.touches || e.originalEvent.touches;
      if (touches && touches.length) {
        e.clientX = touches[0].clientX;
        e.clientY = touches[0].clientY;
      }

      e.preventDefault();
    }
  }
}
