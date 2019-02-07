import { Observable } from 'rxjs';
import { IAction } from './action.interface';
import { FlatItemNode } from '../models/flat-item-node.model';


export interface ITreeConfig<T> {
  levels?: number;
  selection?: boolean;
  data?: T;
  changed?: (data: T) => void;
  childrenName?: string;
  actions?: IAction[];
  canDrop?: (node?: FlatItemNode, fromParent?: FlatItemNode, toParent?: FlatItemNode) => boolean;
}
