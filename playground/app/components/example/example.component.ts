import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';

import { ItemType } from '@firestitch/filter';
import { FsTreeComponent, ItemNode, ITreeConfig, TreeDragAxis } from '@firestitch/tree';

import { of } from 'rxjs';

import { TreeData } from '../../data';


@Component({
  selector: 'example',
  templateUrl: './example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleComponent {

  @ViewChild('tree')
  public tree: FsTreeComponent<any>;

  public keyword: string = '';

  public config: ITreeConfig<any> = {
    data: TreeData,
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
    changeFilter: (query) => {
      console.log('== Change Filter Callback', query);

      return of(null);
    },
    selection: {
      selected: (node: ItemNode) => {
        return node.data.id <= 10;
      },
      change: (selected: ItemNode[]) => {
        console.log('Selection Change', selected);

        return of(null);
      },
    },
    childrenName: (level) => {
      return 'accounts';
    },
    levelName: (level) => {
      return 'account';
    },
    filters: [
      {
        label: 'Search',
        type: ItemType.Keyword,
        name: 'keyword',
      },
    ],

  };

  public collapseAll() {
    this.tree.collapseAll();
  }

  public expandAll() {
    this.tree.expandAll();
  }

  public consoleDebug() {
    const rootNodes = this.tree.getNodes(null);
    console.log('Get Data', this.tree.getData());
    
    console.log('Get Root Nodes', rootNodes);

    const firstRootChildrenNodes = this.tree.getNodes(rootNodes[0]);
    console.log('First Root Node Children', firstRootChildrenNodes);
  }
}
