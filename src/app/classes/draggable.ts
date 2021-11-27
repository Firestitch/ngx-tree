import { ElementRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Droppable } from './droppable';

import { FlatItemNode } from '../models/flat-item-node.model';
import { ItemNode } from '../models/item-node.model';
import { IDragEnd } from '../interfaces/draggable.interface';
import { LoggerService } from '../services/logger.service'


export class Draggable {

  public dragging = false;

  private _droppable: Droppable;
  private _scrolled = false;

  // Drag
  // Draggable target from event.target when drag started
  private _dragTarget: HTMLDivElement = null;
  // Draggable HTML node (copy from dragTarget)
  private _draggableEl: HTMLDivElement = null;

  private _expandedBeforeDrag = false;

  // Observables
  private _dragStart$ = new Subject<void>();
  private _dragEnd$ = new Subject<IDragEnd>();
  private _expandNode$ = new Subject<FlatItemNode>();
  private _destroy$ = new Subject();

  // Shift for align element under correct cursor position
  private _shiftX;

  // Dimentions for dragTarget for future calculations
  private _dragDims;

  private _containerHeight = 0;
  private _screenHeight = 0;
  private _limitToScroll = 0;

  // Handlers for remove listeners in feature
  private _dragStartHandler = this.dragStart.bind(this);
  private _moveHandler = this.dragTo.bind(this);
  private _dropHandler = this.dragEnd.bind(this);

  /**
   * Class for control mouse/touch drag
   * @param _containerElement
   * @param _node
   * @param _el
   * @param _target
   * @param _nodes
   * @param _restrictions
   * @param _logger
   */
  constructor(
    private _containerElement: ElementRef,
    private _node: FlatItemNode,
    private _el: ElementRef,
    private _target: ElementRef,
    private _nodes: Map<ItemNode, FlatItemNode>,
    private _restrictions: any,
    private _logger: LoggerService,
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

    if (!this._node.canDrag) { return; }

    this._touchFix(event);

    this.calcAutoScrollParams();

    // Emit event that drag started
    this._dragStart$.next();

    // Store information about expand status. If node has been expanded, then we should expand it after drag
    this._expandedBeforeDrag = this._node.isExpanded();

    // Collapse node before drag
    if (this._expandedBeforeDrag) {
      this._node.collapse();
      this._hideChildrenNodes(this._node);
    }

    this._logger.timeStart('DRAG_START');

    // Update level 0 statuses
    this._nodes.forEach((node) => {
      if (node.level === 0) {

        this._logger.log('Drag Start Checking', node);

        node.hidden = false;
        if (node.isExpanded()) {
          this._checkChildrenExpandedStatus(node, true);
        } else {
          this._hideChildrenNodes(node);
        }
      }
    });

    this._logger.timeStop('DRAG_START');

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

    this._initDroppable(event);

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

    const topOffset = (event.y || event.clientY) - (this._dragDims.height / 2);
    const leftOffset = (event.x || event.pageX) - this._shiftX;

    this._draggableEl.style.top =  topOffset + 'px';
    this._draggableEl.style.left =  leftOffset + 'px';

    if (event.clientY < this._limitToScroll) {
      this._scrolled = true;

      window.scrollTo(event.clientX, window.pageYOffset - 2);

      this.destroyDroppable();

      return;
    }

    if (this._screenHeight - this._limitToScroll < event.clientY) {
      this._scrolled = true;

      window.scrollTo(event.clientX, window.pageYOffset + 2);

      this.destroyDroppable();

      return;
    }

    if (this._scrolled) {
      this._initDroppable(event);
      this._scrolled = false;
    }

    this._droppable.moveDroppable(event);
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

    if (this._expandedBeforeDrag) {
      this._expandedBeforeDrag = false;
      this._node.expand();
    }

    if (this._droppable.dropTarget && this._droppable.dropPosition && this._droppable.canDropHere) {
      this._dragEnd$.next({
        node: this._node,
        dropInto: this._droppable.dropTarget,
        dropPosition: this._droppable.dropPosition,
      });
    }


    window.document.body.classList.remove('block-selection');
    this._node.el.classList.remove('draggable-elem');

    this.destroyDroppable();

    this._draggableEl.remove();
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

  public destroyDroppable() {
    if (this._droppable) {
      this._droppable.destroy();
      this._droppable = null;
    }
  }

  /**
   * Subscribe to events
   */
  private _subscribe() {
    this._expandNode$
      .pipe(takeUntil(this._destroy$))
      .subscribe((node) => {
        if (this._node !== node) {
          this._logger.log('EXPANDED OVER', node);
          node.expand();

          this._logger.timeStart('EXPANDED_OVER');
          this._checkChildrenExpandedStatus(node, true);
          this._droppable.orderNodesByCoords();
          this._logger.timeStop('EXPANDED_OVER');
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

  private _initDroppable(event) {
    this._droppable = new Droppable(
      this._node,
      this._el,
      this._draggableEl,
      this._nodes,
      this._dragDims,
      this._expandNode$,
      this._restrictions.canDrop,
      this._logger,
    );

    this._droppable.shift((event.x || event.clientX) - this._dragDims.left);

    this._node.el.classList.add('draggable-elem');
  }

  /**
   * Do check and update hidden status for all children for target node
   * @param node
   * @param showFirstLevel
   */
  private _checkChildrenExpandedStatus(node: FlatItemNode, showFirstLevel = false) {
    if (node.original.children) {
      node.original.children.forEach((child) => {
        const childNode = this._nodes.get(child);

        if (showFirstLevel) {
          childNode.hidden = false;
        }

        if (!childNode.isExpanded()) {

          this._logger.log('Check Children[NOT EXPANDED]', node);

          this._hideChildrenNodes(childNode);
        } else {
          this._logger.log('Check Children[EXPANDED]', node);

          this._checkChildrenExpandedStatus(childNode, true);
        }
      });
    }
  }
  // // Mark all children nodes as hidden = false
  // private _showChildrenNodes(node: FlatItemNode) {
  //   if (node.original.children) {
  //     node.original.children.forEach((child) => {
  //       const childNode = this._nodes.get(child);
  //       childNode.hidden = false;
  //       this._showChildrenNodes(childNode);
  //     });
  //   }
  // }

  /**
   * Mark all children nodes as hidden
   * @param node
   */
  private _hideChildrenNodes(node: FlatItemNode) {
    if (node.original.children) {
      node.original.children.forEach((child) => {
        const childNode = this._nodes.get(child);

        this._logger.log('Hide Children', [childNode.data, childNode]);

        childNode.hidden = true;
        this._hideChildrenNodes(childNode);
      });
    }
  }

  private calcAutoScrollParams() {
    const containerSizes = this._containerElement.nativeElement.getBoundingClientRect();
    this._containerHeight = containerSizes.height;

    if (window.matchMedia('(orientation: landscape)').matches) {
      this._screenHeight = screen.availWidth || screen.width;
    } else {
      this._screenHeight = screen.availHeight || screen.height;
    }

    this._limitToScroll = this._screenHeight * 0.15;
    if (this._limitToScroll > 100) {
      this._limitToScroll = 100;
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
