import { Observable } from 'rxjs';

import { FsTreeAction } from './action.interface';
import { FlatItemNode } from '../models/flat-item-node.model';
import { ITreeDataChange } from '../interfaces/tree-data-change.interface';
import { ItemNode } from '../models/item-node.model';


export interface ITreeConfig<T> {
  levels?: number;
  selection?: ITreeSelectionConfig;
  data?: T;
  change?: (data: ITreeDataChange) => void;
  sortBy?: (data: T[], parent?: T ) => T[];
  childrenName?: string;
  actions?: FsTreeAction[];
  canDrag?: canDrag;
  canDrop?: CanDrop;
  nodeClass?: nodeClass;
  nodeClick?: (event: IFsTreeNodeClick) => void;
  canNodeClick?: canNodeClick;
}

export type canDrag = (node: FlatItemNode) => boolean;
export type canNodeClick = (node: FlatItemNode) => boolean;
export type nodeClass = (node: FlatItemNode) => string | string[];

export type CanDrop = (
  node?: FlatItemNode,
  fromParent?: FlatItemNode,
  toParent?: FlatItemNode,
  dropPosition?: any,
  prevElement?: FlatItemNode,
  nextElement?: FlatItemNode,
) => boolean;

export interface ITreeSelectionConfig {
  change?: (selected: ItemNode[]) => Observable<any>;
  selected?: (node: ItemNode) => boolean;
}

export interface IFsTreeNodeClick {
  node?: FlatItemNode;
}
