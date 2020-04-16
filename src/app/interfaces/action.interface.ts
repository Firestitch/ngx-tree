import { FlatItemNode } from '../models/flat-item-node.model';
import { TreeActionType } from '../models/action.model';

export interface FsTreeAction {
  type?: TreeActionType;
  icon?: string;
  items?: FsTreeActionItem[];
}

export type FsTreeActionItem = (FsTreeActionItemConfig | FsTreeActionItemsGroup);

export interface FsTreeActionItemsGroup {
  label?: string;
  items: FsTreeActionItemConfig[];
}

export interface FsTreeActionItemConfig {
  label?: string;
  show?: FsTreeActionShowFn;
  click?: FsTreeActionClickFn;
  link?: FsTreeActionLinkFn;
}


export type FsTreeActionShowFn = (node: FlatItemNode) => boolean;
export type FsTreeActionLinkFn = (node: FlatItemNode) => FsTreeActionActionLink;
export type FsTreeActionClickFn = (node: FlatItemNode) => void;

export interface FsTreeActionActionLink {
  link: any[] | string;
  queryParams?: Record<string, any>;
}

