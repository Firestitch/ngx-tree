import { ItemNode } from '../models/item-node.model';

import { getChildrenName } from './get-children-name';

/**
 * Convert tree to simple data object
 */
export function dataBuilder(
  tree: ItemNode[], 
  childrenName: string | ((level: number) => string) = null,
  level = 0, 
  data: any = [],
) {
  tree.forEach((node) => {
    const nodeData = node.data;

    if (node.children && node.children.length > 0) {
      level += 1;
      const name = getChildrenName(childrenName, level);

      nodeData[name] = dataBuilder(node.children, childrenName, level);
    }

    data.push(nodeData);
  });

  return data;
}
