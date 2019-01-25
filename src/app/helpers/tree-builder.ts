import { ItemNode } from '../models/item-node.model';

/**
 * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
 * The return value is the list of `treeBuilder`.
 */
export function treeBuilder(obj: object, level = 0, parent = null, maxLevel = Infinity): ItemNode[] {
  // Limit
  if (level > maxLevel) { return; }

  return Object.keys(obj).reduce<ItemNode[]>((accumulator, key) => {
    const value = obj[key];
    const nodeData: any = {};
    nodeData.data = key;
    nodeData.parent = parent;

    if (value != null) {
      if (typeof value === 'object') {
        nodeData.children = treeBuilder(value, level + 1, nodeData, maxLevel);
      } else {
        nodeData.data = value;
      }
    }

    const node = new ItemNode(nodeData);

    return accumulator.concat(node);
  }, []);
}
