import { ChangeDetectionStrategy, Component } from '@angular/core';

import { environment } from './../environments/environment';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {

  public config = environment;

}
