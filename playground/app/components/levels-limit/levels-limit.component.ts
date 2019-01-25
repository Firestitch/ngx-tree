import { Component } from '@angular/core';
import { ITreeConfig } from '@firestitch/tree';
import { TREE_DATA } from '../../data';

@Component({
  selector: 'levels-limit',
  templateUrl: 'levels-limit.component.html'
})
export class LevelsLimitComponent {
  public config: ITreeConfig<any> = {
    data: TREE_DATA,
    changed: (data) => {
      console.log('Data was changed: ', data);
    },
    levels: 2,
    selection: false,
  }
}
