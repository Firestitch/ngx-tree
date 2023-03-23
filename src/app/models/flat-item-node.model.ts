import { ItemNode } from './item-node.model';


export class FlatItemNode {
  public el: any;
  public expandable: boolean;
  public original: ItemNode;
  public originalParent: ItemNode;
  public hidden = false; // Need for droppable orderNodesByCoords
  public isExpanded;
  public collapse;
  public expand;
  public canDrag = true;
  public canNodeClick = true;
  public templateContext: any = {};

  private _lastNode = false;
  private _firstNode = false;
  private _index: number = null;

  private _dataStoredKeys = [];
  private _data: any;
  private _level: number;
  private _parent: FlatItemNode;

  constructor(data: any = {}) {
    this.data = data.data || null;
    this.level = data.level;
    this.expandable = data.expandable || false;
    this.parent = data.parent || null;
    this.original = data.original || null;
    this.originalParent = data.originalParent || null;
    this.isExpanded = data.isExpanded || function() { return false };
    this.collapse = data.collapse || function() { };
    this.expand = data.expand || function() { };
    this.canDrag = data.canDrag === void 0 ? true : data.canDrag;
    this.canNodeClick = data.canNodeClick === void 0 ? true : data.canNodeClick;
    this.hidden = this.isExpanded();
  }

  get data() {
    return this._data;
  }

  set data(value) {
    this._data = value;

    if (this.original) {
      this.original.data = value
    }

    this._updateContext();
  }

  get level() {
    return this._level;
  }

  set level(value) {
    this._level = value;
    this.templateContext.level = this.level;
  }

  get parent() {
    return this._parent;
  }

  set parent(value) {
    this._parent = value;
    this.templateContext.parent = this.parent;
  }

  set index(value: number) {
    this._index = value;
  }

  get index(): number {
    return this._index;
  }

  set first(value: boolean) {
    this._firstNode = value;
  }

  set last(value: boolean) {
    this._lastNode = value;
  }

  /**
   * Do update for template Context
   */
  private _updateContext() {
    // Remove previously stored data keys (deduplicate)
    this._dataStoredKeys.forEach((key) => {
      delete this.templateContext[key];
    });
    delete this.templateContext.node;

    // Store new data keys
    if (this.data) {
      this._dataStoredKeys = Object.keys(this.data);
    }

    for (const key in this.data) {
      const item = this.data[key];

      if (this.data.hasOwnProperty(key)) {
        this.templateContext[key] = item;
      }
    }

    this.templateContext.level = this.level;
    this.templateContext.parent = this.parent;
    this.templateContext.data = this._data;
    this.templateContext.node = this._data;
    this.templateContext.flatItemNode = this;
    this.templateContext.index = this._index;
    this.templateContext.last = this._lastNode;
    this.templateContext.first = this._firstNode;
  }

}
