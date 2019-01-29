import { IAction } from './action.interface';


export interface ITreeConfig<T> {
  levels?: number;
  selection?: boolean;
  data?: T;
  changed?: (data: T) => void;
  childrenName?: string;
  actions?: IAction[]
}
