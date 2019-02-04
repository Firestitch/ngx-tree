import { ItemNode } from './item-node.model';


export class FlatItemNode {
  public el: any;
  public data: string;
  public level: number;
  public expandable: boolean;
  public parent: FlatItemNode;
  public original: ItemNode;
  public originalParent: ItemNode;

  constructor(data: any = {}) {
    this.data = data.data || null;
    this.level = data.level;
    this.expandable = data.expandable || false;
    this.parent = data.parent || null;
    this.original = data.original || null;
    this.originalParent = data.originalParent || null;
  }

}
