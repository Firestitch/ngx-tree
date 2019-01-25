import { ItemNode } from '../models/item-node.model';

/**
 * Convert tree to simple data object
 */
export function dataBuilder(tree: ItemNode[], data: any = {}) {
  tree.forEach((node) => {
    data[node.data] = node.children && node.children.length > 0
      ? dataBuilder(node.children)
      : null;
  });

  return data;
}
