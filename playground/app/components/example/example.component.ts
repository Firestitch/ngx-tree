import { Component, ViewChild } from '@angular/core';
import { FsTreeComponent, ItemNode, ITreeConfig, TreeDragAxis } from '@firestitch/tree';
import { of } from 'rxjs';
import { TREE_DATA } from '../../data';


@Component({
  selector: 'example',
  templateUrl: 'example.component.html'
})
export class ExampleComponent {

  @ViewChild('tree')
  public tree: FsTreeComponent<any>;

  public config: ITreeConfig<any> = {
    data: TREE_DATA,
    dragAxis: TreeDragAxis.Y,
    expandLevel: Infinity,
    init: (data) => {
      console.log('== Init Callback', data);
    },
    changeUpdate: (data) => {
      console.log('== Update Callback', data);
    },
    changeRemove: (data) => {
      console.log('== Remove Callback', data);
    },
    changeInsert: (data) => {
      console.log('== Insert Callback', data);
    },
    changeReorder: (data) => {
      console.log('== Reorder Callback', data);
    },
    selection: {
      selected: (node: ItemNode) => {
        return node.data.id <= 10;
      },
      change: (selected: ItemNode[]) => {
        console.log('Selection Change', selected);
        return of(null);
      }
    },
    childrenName: 'accounts',
  };

  public collapseAll() {
    this.tree.collapseAll();
  }

  public expandAll() {
    this.tree.expandAll();
  }

  public consoleDebug() {
    const rootNodes = this.tree.getNodes(null);
    console.log('Get Root Nodes', rootNodes);
    
    const firstRootChildrenNodes = this.tree.getNodes(rootNodes[0]);
    console.log('First Root Node Children', firstRootChildrenNodes);
  }
}
