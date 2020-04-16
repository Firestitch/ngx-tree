import { FsTreeActionItem, FsTreeActionItemsGroup } from '../interfaces/action.interface';

export function isGroupItem(item: FsTreeActionItem): item is FsTreeActionItemsGroup{
  return (item as FsTreeActionItemsGroup).items !== void 0
}
