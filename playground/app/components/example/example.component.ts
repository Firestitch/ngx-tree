import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';

import { ItemType } from '@firestitch/filter';
import { FlatItemNode, FsTreeComponent, ItemNode, ITreeConfig, TreeDragAxis } from '@firestitch/tree';

import { of } from 'rxjs';

import { TreeData } from '../../data';
import { MatButton } from '@angular/material/button';
import { FsTreeComponent as FsTreeComponent_1 } from '../../../../src/app/components/tree/tree.component';
import { FsTreeNodeDirective } from '../../../../src/app/directives/tree-node.directive';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';


@Component({
    selector: 'example',
    templateUrl: './example.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatButton,
        FsTreeComponent_1,
        FsTreeNodeDirective,
        MatFormField,
        MatLabel,
        MatInput,
        FormsModule,
    ],
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
    filterItem: (node: ItemNode, query) => {
      console.log('== Filter Item Callback', query);

      return node.data.name.toLowerCase().indexOf(query) > -1;
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
