import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

import { FsExampleModule } from '@firestitch/example';
import { FsMessageModule } from '@firestitch/message';
import { FsTreeModule } from '@firestitch/tree';

import { ToastrModule } from 'ngx-toastr';

import { AppMaterialModule } from './material.module';
import {
  ExampleComponent,
  LevelsLimitComponent,
  FixedManageOrderingComponent,
  ManageFixedOrderingComponent,
  FixedFixedOrderingComponent,
  ActionsComponent,
  EditDialogComponent,
} from './components';
import { AppComponent } from './app.component';


@NgModule({
  bootstrap: [ AppComponent ],
  imports: [
    BrowserModule,
    FsTreeModule,
    BrowserAnimationsModule,
    AppMaterialModule,
    FormsModule,
    RouterModule.forRoot([], { relativeLinkResolution: 'legacy' }),
    FsExampleModule.forRoot(),
    FsMessageModule.forRoot(),
    ToastrModule.forRoot({ preventDuplicates: true }),
  ],
  entryComponents: [
  ],
  declarations: [
    AppComponent,
    ExampleComponent,
    LevelsLimitComponent,
    FixedManageOrderingComponent,
    ManageFixedOrderingComponent,
    FixedFixedOrderingComponent,
    ActionsComponent,
    EditDialogComponent,
  ],
  providers: [
  ],
})
export class PlaygroundModule {
}
