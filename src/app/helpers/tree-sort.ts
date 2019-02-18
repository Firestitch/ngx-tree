import { ItemNode } from '../models/item-node.model';

/**
 * Build the tree structure. The `value` is the Json object, or a sub-tree of a Json object.
 * The return value is the list of `treeBuilder`.
 */
export function treeSort(
  target,
  sortFn: any
): any {
  if (!sortFn) { return target; }

  const isArray = Array.isArray(target);

  if (isArray) {
    target.forEach((item) => {
      if (item.children) {
        item.children = treeSort(item.children, sortFn);
      }
    });

    return sortDataBy(target, sortFn);
  }
}

export function sortDataBy(data: ItemNode[], sortFn, parent?) {

  if (!sortFn) { return data; }

  const _cachedNodes = new Map<any, ItemNode>();

  const cleanData = data.map((node) => {
    _cachedNodes.set(node.data, node);

    return node.data;
  });

  if (!parent && data.length > 0) {
    parent = data[0].parent && data[0].parent.data;
  } else if (parent) {
    parent = parent.data;
  }

  const sortedData = sortFn(cleanData, parent);

  const sortedNodes = sortedData.reduce((acc, item) => {
    const node = _cachedNodes.get(item);
    node.data = item;
    acc.push(node);

    return acc;
  }, []);

  _cachedNodes.clear();

  return sortedNodes;
}

