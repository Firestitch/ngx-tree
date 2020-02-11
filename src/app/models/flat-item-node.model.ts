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
  public templateContext: any = {};

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

  /**
   * Do update for template Context
   */
  private _updateContext() {
    // Remove previously stored data keys (deduplicate)
    this._dataStoredKeys.forEach((key) => {
      delete this.templateContext[key];
    });

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
  }

}
