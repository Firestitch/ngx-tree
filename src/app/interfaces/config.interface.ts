import { Observable } from 'rxjs';

import { TreeDragAxis } from '../enums/drag-axis.enum';
import { ITreeDataChange } from '../interfaces/tree-data-change.interface';
import { FlatItemNode } from '../models/flat-item-node.model';
import { ItemNode } from '../models/item-node.model';

import { FsTreeAction } from './action.interface';


export interface ITreeConfig<T> {
  maxLevel?: number;
  expandLevel?: number;
  selection?: ITreeSelectionConfig;
  data?: T;
  init?: (data: ItemNode[]) => void;
  changeReorder?: (data: ITreeChangeReorder) => void;
  changeInsert?: (data: ITreeChangeInsert) => void;
  changeRemove?: (data: ITreeChangeRemove) => void;
  changeUpdate?: (data: ITreeChangeUpdate) => void;
  /**
   * @deprecated Use separated callbacks instead
   */
  change?: (data: ITreeDataChange) => void;
  sortBy?: (data: T[], parent?: T ) => T[];
  childrenName?: string | ((level: number) => string);
  actions?: FsTreeAction[];
  draggable?: boolean,
  canDrag?: TreeCanDrag;
  canDrop?: CanDrop;
  nodeClass?: TreeNodeClass;
  nodeClick?: (event: ITreeNodeClick) => void;
  canNodeClick?: TreeCanNodeClick;
  dragAxis?: TreeDragAxis;
}

export type TreeCanDrag = (node: FlatItemNode) => boolean;
export type TreeCanNodeClick = (node: FlatItemNode) => boolean;
export type TreeNodeClass = (node: FlatItemNode) => string | string[];

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

export interface ITreeNodeClick {
  node?: FlatItemNode;
}

export interface ITreeChangeUpdate {
  node: FlatItemNode;
}

export interface ITreeChangeInsert {
  position: 'into' | 'above' | 'below',
  parent: FlatItemNode;
  node: FlatItemNode;
  index: number;
}

export interface ITreeChangeRemove {
  target: FlatItemNode;
}

export interface ITreeChangeReorder {
  fromParent: FlatItemNode;
  toParent: FlatItemNode;
  node: FlatItemNode;
  index: number;
}
