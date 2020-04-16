import { ActionItem } from './action-item.model';
import { FsTreeAction } from '../interfaces/action.interface';
import { FlatItemNode } from './flat-item-node.model';

export enum TreeActionType {
  Menu = 0,
}

export class Action {
  public type: TreeActionType;
  public icon: string;
  public items: ActionItem[];

  public static create(data: FsTreeAction, node: FlatItemNode) {
    const action = new Action(data);

    if (action.type === TreeActionType.Menu) {
      action.items.forEach((item) => item.update(node));
    }

    return action;
  }

  constructor(data: FsTreeAction = {}) {
    this.type = data.type;
    this.icon = data.icon || null;
    this.items = data.items
      ? data.items.map((item) => new ActionItem(item))
      : [];
  }
}
