import { IAction } from './action.interface';
import { FlatItemNode } from '../models/flat-item-node.model';
import { ITreeDataChange } from '../interfaces/tree-data-change.interface';


export interface ITreeConfig<T> {
  levels?: number;
  selection?: boolean;
  data?: T;
  changed?: (data: ITreeDataChange) => void;
  sortBy?: (data: T[], parent?: T ) => T[];
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
