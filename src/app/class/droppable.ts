import { ElementRef } from '@angular/core';

import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { lookupNearPoint, lower } from '../helpers/binary';
import { IOrderedNode } from '../interfaces/draggable.interface';
import { FlatItemNode } from '../models/flat-item-node.model';
import { ItemNode } from '../models/item-node.model';


export class Droppable {

  // Nodes ordered by asc by their X coord
  private _orderedNodes: IOrderedNode[] = [];

  private _dropPosition: 'above' | 'below' | 'center';

  // Line for highlight drop place
  private _droppableEl: HTMLDivElement;
  private _defaultDropAreaWidth = 0;

  // Target element for drop above/below/into
  private _dropTarget: FlatItemNode;
  // Level for drop (padding from left side)
  private _dropLevel = 0;
  private _canDropHere = true;
  // Х position for first level (0)
  private _rootLevelPosition: number = null;
  // Shift for align element under correct cursor position
  private _shiftX = 0;

  // During very fast drag we should use some array/set for contain
  // elements which had been marked "over" (center). And we will clean all of them when it's needed
  private _cacheOfDragOveredElements = new Set<HTMLDivElement>();

  // Default for one level. For example if element has level 4 then padding will be 4 * 40
  private readonly _defaultPadding = 40;
  // Extra padding for correct align highlight area under element
  private readonly _extraPadding = 30;
  // Half of height of highlight area
  private readonly _droppableHalfHeight = 5;

  // Time for expand node when position 'center'
  private _timer$ = timer(300);
  // Cancel timer
  private _timerDestroy$ = new Subject<void>();
  private _timerStarted = false;

  /**
   * Here is the main Drag&Drop controller
   * Droppable class gives us higlight for drag & drop
   * Do calculation of target drop element, position (above, below, center) and level
   * Do check for canDrop rule
   *
   * @param _node
   * @param _targetEl
   * @param _draggableEl
   * @param _nodes
   * @param _dragDims
   * @param _expandNode$
   * @param _canDrop
   */
  constructor(
    private _node: FlatItemNode,
    private _targetEl: ElementRef,
    private _draggableEl: HTMLDivElement,
    private _nodes: Map<ItemNode, FlatItemNode>,
    private _dragDims,
    private _expandNode$: Subject<FlatItemNode>,
    private _canDrop = null,
  ) {
    this._orderNodesByCoords();
    this._initDroppableElement();
    this._getRootPosition(this._node);
  }

  get dropPosition() {
    return this._dropPosition;
  }


  get dropTarget() {
    return this._dropTarget;
  }

  get canDropHere() {
    return this._canDropHere;
  }

  public shift(val) {
    this._shiftX = val;
  }

  /**
   * Move droppable area and set dropTarget, dropLevel & dropPosition
   * @param event
   */
  public moveDroppable(event) {
    // Element under our drag
    const [element, isec] = this._lookupElementUnder(event);

    // Correct X position
    const eventX = (event.x || event.clientX) - this._shiftX;

    this._dropPosition = this._getPositionByIsec(isec);

    switch (this._dropPosition) {
      case 'above': {
        this._cancelExpandTimer();
        this._cancelDragOverSelections();

        // Show droppable area and move it
        // if (element.node === this._node) {
        //   this._droppableEl.style.display = 'none';
        //   return;
        // }
        this._droppableEl.style.display = 'block';
        const top = element.dimentions.top - this._droppableHalfHeight;
        this._droppableEl.style.top = top + 'px';

        this._updateLevelPaddingAbove(element, eventX);

        // console.log('above, ', this._dropLevel, element.node.level, element.node.data);

        // If target level for drop more than element under our drag
        if (this._dropLevel > element.node.level) {
          this._dropTarget = this._lookupNodeWithLevelAbove(element);
          this._dropPosition = 'below';
        } else {
          this._dropTarget = element.node;
        }

        // Hide drop area if can't drop
        if (!this._checkIfCanDrop(this._dropTarget && this._dropTarget.parent)) {
          this._droppableEl.style.display = 'none';
          this._draggableEl.classList.add('no-drop');
        } else {
          this._draggableEl.classList.remove('no-drop');
        }

      } break;

      case 'center': {
        if (!this._timerStarted && element.node !== this._node) {
          this._startExpandTimer(element.node);
        }

        this._dropTarget = element.node;

        this._droppableEl.style.display = 'none';

        if (this._checkIfCanDrop(this._dropTarget) && element.node !== this._node) {
          // Add marked element for unmark in feature
          this._cacheOfDragOveredElements.add(element.node.el);

          // Mark element
          element.node.el.classList.add('drag-over');
          this._draggableEl.classList.remove('no-drop');
        } else {
          this._draggableEl.classList.add('no-drop');
        }

      } break;

      case 'below': {
        this._cancelExpandTimer();
        this._cancelDragOverSelections();

        // Show droppable area and move it
        // if (element.node === this._node) {
        //   this._droppableEl.style.display = 'none';
        //   return;
        // }
        this._droppableEl.style.display = 'block';
        const top = element.dimentions.top + element.dimentions.height - this._droppableHalfHeight;
        this._droppableEl.style.top = top + 'px';

        this._updateLevelPaddingBelow(element, eventX);

        // console.log('below, ', this._dropLevel, element.node.level, element.node.data);

        // If target level for drop less than element under our drag
        if (this._dropLevel < element.node.level) {
          this._dropTarget = this._lookupNodeWithLevelBelow(element);
          this._dropPosition = 'above';
          // Когда внизу
          if (!this._dropTarget) {
            this._dropTarget = this._lookupNodeWithLevelAbove(element);
            this._dropPosition = 'below';
          }
        } else if (this._dropLevel > element.node.level) {
          this._dropTarget = this._lookupNodeWithLevelBelow(element);
          this._dropPosition = 'above';
        } else {
          this._dropTarget = element.node;
        }

        // Hide drop area if can't drop
        if (!this._checkIfCanDrop(this._dropTarget && this._dropTarget.parent)) {
          this._droppableEl.style.display = 'none';
          this._draggableEl.classList.add('no-drop');
        } else {
          this._draggableEl.classList.remove('no-drop');
        }
      } break;
    }
  }


  public destroy() {
    this._orderedNodes = [];

    this._cancelDragOverSelections();
    this._droppableEl.remove();

    this._cancelExpandTimer();
    this._timerDestroy$.complete();
  }

  /**
   * Return level for drop based on current X coordinate
   * @param x
   * @param minLevel
   * @param maxLevel
   */
  private _getDropLevel(x: number, minLevel: number, maxLevel: number): number {
    const diff = x - this._rootLevelPosition - 20;

    if (diff >= 0) {
      const level = Math.round(diff / 40);

      if (level > maxLevel) {
        return maxLevel
      } else if (level < minLevel) {
        return minLevel;
      } else {
        return level;
      }
    }

    return minLevel || 0;
  }

  /**
   * Init droppable element
   */
  private _initDroppableElement() {
    const droppableEl = document.createElement('div');
    const dimensions = this._targetEl.nativeElement.getBoundingClientRect();

    droppableEl.style.display = 'none';
    droppableEl.style.width = dimensions.width + 'px';

    droppableEl.classList.add('droppable-area');
    this._defaultDropAreaWidth = parseFloat(droppableEl.style.width);

    this._targetEl.nativeElement.append(droppableEl);
    this._droppableEl = droppableEl;
  }

  /**
   * Return X coordinate for parent with level 0
   * @param node
   * @private
   */
  private _getRootPosition(node) {
    if (!node.parent) {
      const dimensions = node.el.getBoundingClientRect();

      this._rootLevelPosition = dimensions.x;

      return;
    }

    this._getRootPosition(node.parent);
  }

  /**
   * Looking by ordered elements element which under draggable
   * @param event
   */
  private _lookupElementUnder(event): [ IOrderedNode, number] {
    const y = event.y || event.clientY;

    const topOffset = y;
    const halfOfDragHeight = this._dragDims.height / 2;

    const elIndex = lookupNearPoint(
      this._orderedNodes,
      topOffset,
      (node) => node.dimentions.y + halfOfDragHeight
    );

    const el = this._orderedNodes[elIndex];

    if (el) {

      const draggableRect = {
        y1: y,
        y2: y + this._dragDims.height,
      };
      const rectUnder = {
        y1: el.dimentions.y,
        y2: el.dimentions.y + el.dimentions.height,
      };

      const isec = this._calcRectIntersection(
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
  private _calcRectIntersection(y11: number, y12: number, y21: number, y22: number) {

    if (y21 > y12) { return 0; }
    if (y22 < y12) { return 1; }

    const y1Isec = Math.max(y11, y21);
    const y2Isec = Math.min(y12, y22);

    const intersectionArea = y2Isec - y1Isec;

    const rect1Area = y12 - y11;

    return intersectionArea / rect1Area;
  }

  /**
   * Return drop position based on persentage of overlap
   * @param isec
   * @private
   */
  private _getPositionByIsec(isec) {
    if (isec < 0.30) {
      return 'below';
    } else if (isec > 0.70) {
      return 'above';
    } else {
      return 'center';
    }
  }

  /**
   * Remove classes for elements which were under our drag
   * @private
   */
  private _cancelDragOverSelections() {
    this._cacheOfDragOveredElements.forEach((element) => {
      element.classList.remove('drag-over');
      this._cacheOfDragOveredElements.delete(element);
    });
  }

  /**
   * Update padding for drop area when position is above
   * @param currentEl
   * @param eventX
   * @private
   */
  private _updateLevelPaddingAbove(currentEl, eventX) {
    const elIndex = this._orderedNodes.indexOf(currentEl);
    const prevEl = this._orderedNodes[elIndex - 1];

    const currentLevel = currentEl.node.level;
    const prevLevel = prevEl && prevEl.node.level;

    if (prevEl && prevLevel > currentLevel) {
      this._dropLevel = this._getDropLevel(eventX, currentLevel, prevLevel);
    } else {
      this._dropLevel = this._getDropLevel(eventX, currentLevel, currentLevel);
    }

    const padding = this._rootLevelPosition + this._extraPadding + (this._dropLevel * this._defaultPadding);

    this._droppableEl.style.left = padding + 'px';
  }

  /**
   * Update padding for drop area when position is below
   * @param currentEl
   * @param eventX
   * @private
   */
  private _updateLevelPaddingBelow(currentEl: IOrderedNode, eventX: number) {
    const elIndex = this._orderedNodes.indexOf(currentEl);
    const nextEl = this._orderedNodes[elIndex + 1];

    const currentLevel = currentEl.node.level;
    const nextLevel = nextEl && nextEl.node.level;

    if (nextEl && currentLevel > nextLevel) {
      this._dropLevel = this._getDropLevel(eventX, nextLevel, currentLevel);
    } else {
      this._dropLevel = this._getDropLevel(eventX, nextLevel, nextLevel || currentLevel);
    }

    // console.log('drop below: ', this._dropLevel, prevLevel, nextLevel);
    const padding = this._extraPadding + (this._dropLevel * this._defaultPadding);
    const leftPosition = this._rootLevelPosition + padding;
    const width = this._defaultDropAreaWidth - this._extraPadding;

    this._droppableEl.style.width = width + 'px';
    this._droppableEl.style.left = leftPosition + 'px';
  }

  /**
   * Strong order visible nodes by X coord
   * @private
   */
  private _orderNodesByCoords() {
    this._orderedNodes = [];

    this._nodes.forEach((node) => {
      if (node.el && !node.hidden) {
        const dimentions = node.el.getBoundingClientRect();
        const insertIndex = lower(this._orderedNodes, dimentions.y, (item) => item.dimentions.y);

        this._orderedNodes.splice(
          insertIndex,
          0,
          { dimentions: dimentions, node: node }
        );
      }
    });
  }

  /**
   * Lookup above now with same level as target
   * @param element
   * @private
   */
  private _lookupNodeWithLevelAbove(element: IOrderedNode) {
    let dropTarget = null;
    const elementIndex = this._orderedNodes.indexOf(element);

    for (let i = elementIndex; i >= 0; --i) {
      if (this._orderedNodes[i].node.level === this._dropLevel) {
        dropTarget = this._orderedNodes[i].node;
        break;
      }
    }

    return dropTarget;
  }

  /**
   * Lookup below now with same level as target
   * @param element
   * @private
   */
  private _lookupNodeWithLevelBelow(element) {
    let dropTarget = null;
    const elementIndex = this._orderedNodes.indexOf(element);

    for (let i = elementIndex; i < this._orderedNodes.length; ++i) {
      if (this._orderedNodes[i].node.level === this._dropLevel) {
        dropTarget = this._orderedNodes[i].node;
        break;
      }
    }

    return dropTarget;
  }

  /**
   * If can drop function passed - do call for result
   * @private
   */
  private _checkIfCanDrop(toParent) {
    if (!this._canDrop) {
      return true
    } else {
      this._canDropHere = this._canDrop(this._node, this._node.parent, toParent);
      return this._canDropHere;
    }
  }

  /**
   * Starts timer for expand current node
   * @param node
   * @private
   */
  private _startExpandTimer(node) {
    this._timerStarted = true;
    this._timer$
      .pipe(
        takeUntil(this._timerDestroy$),
      )
      .subscribe(() => {
        this._expandNode$.next(node);
        this._orderNodesByCoords();
      })
  }

  /**
   * Cancel timer for expand
   * @private
   */
  private _cancelExpandTimer() {
    this._timerDestroy$.next();
    this._timerStarted = false;
  }
}
