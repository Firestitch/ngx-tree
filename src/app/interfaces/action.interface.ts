import { FlatItemNode } from '../models/flat-item-node.model';

export interface IAction {
  type?: any;
  icon?: string;
  items?: IActionItem[];
}

export interface IActionItem {
  label?: string;
  show?: (node: FlatItemNode) => boolean;
  click?: (node: FlatItemNode) => void;
}
