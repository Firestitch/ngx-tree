import { ItemNode } from '../models/item-node.model';

/**
 * Convert tree to simple data object
 */
export function dataBuilder(tree: ItemNode[], childrenName: string, data: any = []) {
  tree.forEach((node) => {
    const nodeData = node.data;

    if (node.children && node.children.length > 0) {
      nodeData[childrenName] = dataBuilder(node.children, childrenName)
    }

    data.push(nodeData);
  });

  return data;
}
