import { IActionItem } from '../interfaces/action.interface';

export class ActionItem {
  public label: string;

  public show: any = (data) => true;
  public click: any = (data) => {};

  constructor(data: Partial<IActionItem> = {}) {
    this.label = data.label || null;

    if (data.show) {
      this.show = data.show;
    }

    if (data.click) {
      this.click = data.click;
    }
  }
}
