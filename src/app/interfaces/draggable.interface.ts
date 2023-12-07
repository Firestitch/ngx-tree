import { FlatItemNode } from '../models/flat-item-node.model';

export interface IOrderedNode {
  dimentions: DOMRect;
  node: FlatItemNode;
}

export interface IDragEnd {
  node: FlatItemNode;
  dropInto: FlatItemNode;
  dropPosition: 'above' | 'below' | 'center';
}
