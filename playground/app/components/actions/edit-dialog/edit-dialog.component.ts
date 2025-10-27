import {
  ChangeDetectionStrategy,
  Component, Inject,
  OnDestroy,
} from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';

import { FsMessage } from '@firestitch/message';

import { Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';


@Component({
    templateUrl: './edit-dialog.component.html',
    styleUrls: ['./edit-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        FormsModule,
        MatDialogTitle,
        CdkScrollable,
        MatDialogContent,
        MatFormField,
        MatInput,
        MatDialogActions,
        MatButton,
        MatDialogClose,
    ],
})
export class EditDialogComponent implements OnDestroy {

  public node = null;

  private _destroy$ = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) private _data: any,
    private _dialogRef: MatDialogRef<EditDialogComponent>,
    private _message: FsMessage,
  ) {
    this.node = this._data.node;
  }

  public ngOnDestroy(): void {
    this._destroy$.next(null);
    this._destroy$.complete();
  }

  public save = () => {
    this._message.success('Saved Changes');
    this._dialogRef.close(this.node);
  };

}
