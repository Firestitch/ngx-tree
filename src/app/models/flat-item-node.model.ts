import { ItemNode } from './item-node.model';


export class FlatItemNode {
  public el: any;
  public data: string;
  public level: number;
  public expandable: boolean;
  public parent: FlatItemNode;
  public original: ItemNode;
  public originalParent: ItemNode;
  public hidden = false; // Need for droppable orderNodesByCoords
  public isExpanded;
  public collapse;
  public expand;

  constructor(data: any = {}) {
    this.data = data.data || null;
    this.level = data.level;
    this.expandable = data.expandable || false;
    this.parent = data.parent || null;
    this.original = data.original || null;
    this.originalParent = data.originalParent || null;
    this.isExpanded = data.isExpanded || function() { return false };
    this.collapse = data.collapse || function() { };
    this.expand = data.expand || function() { };
    this.hidden = this.isExpanded();
  }

}
