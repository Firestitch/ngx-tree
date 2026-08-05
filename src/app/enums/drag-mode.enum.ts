export enum TreeDragMode {
  /**
   * Drag is initiated only from the drag handle icon
   */
  Handle = 'handle',

  /**
   * Drag is initiated from anywhere on the node content.
   * Actions menu, checkbox, expand toggle and form controls stay interactive
   */
  Node = 'node',
}
