import { ChangeDetectionStrategy, Component } from '@angular/core';

import { environment } from './../environments/environment';
import { FsExampleModule } from '@firestitch/example';
import { ExampleComponent } from './components/example/example.component';
import { ActionsComponent } from './components/actions/actions.component';
import { LevelsLimitComponent } from './components/levels-limit/levels-limit.component';
import { FixedManageOrderingComponent } from './components/fixed-manage-ordering/fixed-manage-ordering.component';
import { ManageFixedOrderingComponent } from './components/manage-fixed-ordering/manage-fixed-ordering.component';
import { FixedFixedOrderingComponent } from './components/fixed-fixed-ordering/fixed-fixed-ordering.component';


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        FsExampleModule,
        ExampleComponent,
        ActionsComponent,
        LevelsLimitComponent,
        FixedManageOrderingComponent,
        ManageFixedOrderingComponent,
        FixedFixedOrderingComponent,
    ],
})
export class AppComponent {

  public config = environment;

}
