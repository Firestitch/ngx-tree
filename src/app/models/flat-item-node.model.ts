import { ItemNode } from './item-node.model';

export class FlatItemNode {
  public item: string;
  public level: number;
  public expandable: boolean;
  public parent: FlatItemNode;
  public original: ItemNode;
  public originalParent: ItemNode;
}