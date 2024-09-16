import { ItemNode } from '../models/item-node.model';

import { getChildrenName } from './get-children-name';

/**
 * Build the tree structure. The `value` is the Json object, or a sub-tree of a Json object.
 * The return value is the list of `treeBuilder`.
 */
export function treeBuilder(
  target: any,
  level = 0,
  parent = null,
  childrenName: string | ((level: number) => string) = null,
  maxLevel = Infinity,
): any {
  // Limit
  if (level > maxLevel) {
    return; 
  }

  const isArray = Array.isArray(target);

  if (!parent && isArray) {
    return target.reduce((acc, item) => {

      const node = treeBuilder(item, level, parent, childrenName, maxLevel);

      if (node) {
        acc.push(node);
      }

      return acc;
    }, []);
  } else if (parent && isArray) {
    target.forEach((item) => {
      if (!parent.children) {
        parent.children = [];
      }

      const node = treeBuilder(item, level + 1, parent ? parent : [], childrenName, maxLevel);

      if (node) {
        parent.children.push(node);
      }
    });

  } else if (typeof target === 'object') {
    const node = new ItemNode({
      data: target,
      parent: parent,
    });

    const name = getChildrenName(childrenName, level);

    if (target[name]) {
      treeBuilder(target[name], level + 1, node, childrenName, maxLevel);
    }

    return node;
  }

}


