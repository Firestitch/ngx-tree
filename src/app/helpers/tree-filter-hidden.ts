import { ItemNode } from '../models/item-node.model';

export function filterTree(
  node: ItemNode | null
): ItemNode | null {
  if (!node) {
    return null;
  }

  const newNode = new ItemNode(node);
  const visibleChildren: ItemNode[] = [];

  if (node.children) {
    node.children.forEach((child: ItemNode) => {
      const childNode = filterTree(child);

      if (childNode) {
        childNode.parent = newNode;
        visibleChildren.push(childNode);
      }
    });
  }

  newNode.children = visibleChildren.length > 0
    ? visibleChildren
    : null;

  const nodeIsVisible = !node.hidden;
  const includeThisNode = nodeIsVisible || !!newNode.children;

  return includeThisNode ? newNode : null;
}

