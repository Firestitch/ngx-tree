import { Component } from '@angular/core';
import { environment } from '@env';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {
	public config = environment;
}