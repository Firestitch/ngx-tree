export class ItemNode {
  public children: ItemNode[];
  public item: string;
  public parent: ItemNode;

  constructor(data: any = {}) {
    this.children = data.children || null;
    this.item = data.item || null;
    this.parent = data.parent || null;
  }
}
