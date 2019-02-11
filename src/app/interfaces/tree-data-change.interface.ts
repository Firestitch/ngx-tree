import { FsTreeChange } from '../enums/tree-change.enum';


export interface ITreeDataChange {
  type: FsTreeChange;
  payload: any;
}
