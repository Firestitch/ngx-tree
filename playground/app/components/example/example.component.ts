import { Component } from '@angular/core';
import { ITreeConfig } from '@firestitch/tree';
import { TREE_DATA } from '../../data';

@Component({
  selector: 'example',
  templateUrl: 'example.component.html'
})
export class ExampleComponent {
  public config: ITreeConfig<any> = {
    data: TREE_DATA,
    changed: (data) => {
      console.log('Data was changed: ', data);
    },
    selection: true,
  }
}
