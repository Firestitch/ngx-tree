import { SelectionModel } from '@angular/cdk/collections';
import { Component, ViewChild } from '@angular/core';
import { FsTreeChange, FsTreeComponent, ItemNode, ITreeConfig, ITreeDataChange } from '@firestitch/tree';
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
    change: (data: ITreeDataChange) => {
      console.log('Data Change: ', data);
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
}
