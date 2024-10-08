import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { FsExampleModule } from '@firestitch/example';
import { FsMessageModule } from '@firestitch/message';
import { FsTreeModule } from '@firestitch/tree';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import {
  ActionsComponent,
  EditDialogComponent,
  ExampleComponent,
  FixedFixedOrderingComponent,
  FixedManageOrderingComponent,
  LevelsLimitComponent,
  ManageFixedOrderingComponent,
} from './components';
import { AppMaterialModule } from './material.module';


@NgModule({
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    FsTreeModule,
    BrowserAnimationsModule,
    AppMaterialModule,
    FormsModule,
    RouterModule.forRoot([], {}),
    FsExampleModule.forRoot(),
    FsMessageModule.forRoot(),
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
})
export class PlaygroundModule {
}
