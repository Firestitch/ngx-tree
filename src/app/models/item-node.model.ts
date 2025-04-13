export class ItemNode {

  public children: ItemNode[];
  public data: any;
  public parent: ItemNode;
  public hidden: boolean = false;

  constructor(data: any = {}) {
    this.children = data.children || null;
    this.data = data.data || null;
    this.parent = data.parent || null;
  }
}
