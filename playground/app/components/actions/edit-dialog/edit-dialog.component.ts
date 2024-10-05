import {
  ChangeDetectionStrategy,
  Component, Inject,
  OnDestroy,
} from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { FsMessage } from '@firestitch/message';

import { Subject } from 'rxjs';


@Component({
  templateUrl: './edit-dialog.component.html',
  styleUrls: ['./edit-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
