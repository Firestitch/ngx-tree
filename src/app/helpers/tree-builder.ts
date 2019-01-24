import { ItemNode } from '../models/item-node.model';

/**
 * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
 * The return value is the list of `treeBuilder`.
 */
export function treeBuilder(obj: object, level: number, parent = null): ItemNode[] {
  return Object.keys(obj).reduce<ItemNode[]>((accumulator, key) => {
    const value = obj[key];
    const nodeData: any = {};
    nodeData.item = key;
    nodeData.parent = parent;

    if (value != null) {
      if (typeof value === 'object') {
        nodeData.children = treeBuilder(value, level + 1, nodeData);
      } else {
        nodeData.item = value;
      }
    }

    const node = new ItemNode(nodeData);

    return accumulator.concat(node);
  }, []);
}
