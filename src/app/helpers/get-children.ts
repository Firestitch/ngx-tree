import { ItemNode } from '../models/item-node.model';

export function getChildren(node: ItemNode): ItemNode[] {
  return node.children;
}
