import { ActionItem } from './action-item.model';
import { IAction } from '../interfaces/action.interface';

export enum TreeActionType {
  Menu = 0,
}

export class Action {
  public type: TreeActionType;
  public icon: string;
  public items: ActionItem[];

  constructor(data: IAction = {}) {
    this.type = data.type;
    this.icon = data.icon || null;
    this.items = data.items ? data.items.map((item) => new ActionItem(item)) : [];
  }
}
