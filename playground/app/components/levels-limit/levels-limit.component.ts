import { Component, ViewChild } from '@angular/core';
import { FsTreeComponent, ITreeConfig } from '@firestitch/tree';
import { TREE_DATA } from '../../data';


@Component({
  selector: 'levels-limit',
  templateUrl: 'levels-limit.component.html'
})
export class LevelsLimitComponent {
  @ViewChild('tree')
  public tree: FsTreeComponent<any>;

  public config: ITreeConfig<any> = {
    data: TREE_DATA,
    changed: (data) => {
      console.log('Data was changed: ', data);
    },
    levels: 2,
    selection: false,
  };

  public collapseAll() {
    this.tree.collapseAll();
  }

  public expandAll() {
    this.tree.expandAll();
  }
}
