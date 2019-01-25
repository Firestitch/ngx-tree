import { Component, ViewChild } from '@angular/core';
import { FsTreeComponent, ITreeConfig } from '@firestitch/tree';
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
    changed: (data) => {
      console.log('Data was changed: ', data);
    },
    selection: true,
  };

  public collapseAll() {
    this.tree.collapseAll();
  }

  public expandAll() {
    this.tree.expandAll();
  }
}
