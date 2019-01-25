export class ItemNode {
  public children: ItemNode[];
  public data: string;
  public parent: ItemNode;

  constructor(data: any = {}) {
    this.children = data.children || null;
    this.data = data.data || null;
    this.parent = data.parent || null;
  }
}
