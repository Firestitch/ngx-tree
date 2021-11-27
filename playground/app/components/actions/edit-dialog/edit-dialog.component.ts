import {
  Component, Inject, OnInit, OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { FsMessage } from '@firestitch/message';

import { Subject, of } from 'rxjs';


@Component({
  templateUrl: './edit-dialog.component.html',
  styleUrls: ['./edit-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditDialogComponent implements OnInit, OnDestroy {

  public node = null;

  private _destroy$ = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) private _data: any,
    private _dialogRef: MatDialogRef<EditDialogComponent>,
    private _message: FsMessage,
  ) {
    this.node = this._data.node;
  }

  public ngOnInit(): void {}

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public save = () => {
    this._message.success('Saved Changes');
    this._dialogRef.close(this.node);
  };

}
