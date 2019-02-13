import { IAction } from './action.interface';
import { FlatItemNode } from '../models/flat-item-node.model';


export interface ITreeConfig<T> {
  levels?: number;
  selection?: boolean;
  data?: T;
  changed?: (data: T) => void;
  sortBy?: (data: T[], parent?: FlatItemNode) => T[];
  childrenName?: string;
  actions?: IAction[];
  canDrag?: canDrag;
  canDrop?: CanDrop;
}

export type canDrag = (node: FlatItemNode) => boolean;

export type CanDrop = (
  node?: FlatItemNode,
  fromParent?: FlatItemNode,
  toParent?: FlatItemNode,
  dropPosition?: any,
  prevElement?: FlatItemNode,
  nextElement?: FlatItemNode,
) => boolean;
