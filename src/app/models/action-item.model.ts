import {
  FsTreeActionActionLink,
  FsTreeActionClickFn,
  FsTreeActionItem,
  FsTreeActionItemConfig,
  FsTreeActionItemsGroup,
  FsTreeActionLinkFn,
  FsTreeActionShowFn,
} from '../interfaces/action.interface';
import { isGroupItem } from '../helpers/is-group-item';
import { FlatItemNode } from './flat-item-node.model';

export class ActionItem {

  public label: string;

  private _routerLink: FsTreeActionActionLink;
  private _visible = true;

  private _children: ActionItem[];
  private _showFn: FsTreeActionShowFn;
  private _clickFn: FsTreeActionClickFn;
  private _linkFn: FsTreeActionLinkFn;

  private _isGroup = false;

  constructor(data: FsTreeActionItem = {}) {
    this.label = data.label || null;

    if (isGroupItem(data)) {
      this._initGroupItem(data);
    } else {
      this._initActionItem(data);
    }
  }

  public get isGroup(): boolean {
    return this._isGroup;
  }

  public get visible(): boolean {
    return this._visible;
  }

  public get routerLink(): FsTreeActionActionLink {
    return this._routerLink;
  }

  public get children(): ActionItem[] {
    return this._children;
  }

  public click(node: FlatItemNode) {
    this._clickFn(node);
  }

  public update(node: FlatItemNode) {
    this.updateVisibility(node);
    this.updateLink(node);
  }

  public updateVisibility(node: FlatItemNode) {
    if (this._showFn) {
      this._visible = this._showFn(node);
    }

    if (this.isGroup && this._visible) {
      this._children.forEach((action) => {
        action.updateVisibility(node);
      });

      this._visible = this._children
        .some((action) => action._visible);
    }
  }

  public updateLink(row: FlatItemNode) {
    if (!this._visible) {
      return;
    }

    if (this.isGroup) {
      this._children.forEach((action) => {
        action.updateLink(row);
      });
    } else if (this._linkFn) {
      this._routerLink = this._linkFn(row);
    }
  }


  private _initActionItem(data: FsTreeActionItemConfig) {
    if (data.show) {
      this._showFn = data.show;
    }

    if (data.click) {
      this._clickFn = data.click;
    }

    if (data.link) {
      this._linkFn = data.link;
    }
  }

  private _initGroupItem(data: FsTreeActionItemsGroup) {
    this._isGroup = true;
    
    if (data.show) {
      this._showFn = data.show;
    }    

    if (Array.isArray(data.items)) {
      this._children = data.items.map((item) => new ActionItem(item));
    }
  }
}
