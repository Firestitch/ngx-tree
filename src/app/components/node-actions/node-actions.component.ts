import {
  ChangeDetectionStrategy,
  Component, DoCheck,
  Input,
  KeyValueDiffer,
  KeyValueDiffers,
  OnInit
} from '@angular/core';

import { FsTreeAction } from '../../interfaces/action.interface';

import { Action } from '../../models/action.model';
import { FlatItemNode } from '../../models/flat-item-node.model';


@Component({
  selector: 'fs-node-actions',
  templateUrl: './node-actions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FsNodeActionsComponent implements OnInit, DoCheck {
  @Input()
  public rawActions: FsTreeAction[];

  @Input()
  public node: FlatItemNode;

  public actions: Action[] = [];

  private _nodeDiffer: KeyValueDiffer<any, any>;

  constructor(
    private _differs: KeyValueDiffers,
  ) {
    this._nodeDiffer = _differs.find({}).create();
  }

  public ngOnInit() {
    if (this.rawActions) {
      this.actions = this.rawActions
        .map((action) => Action.create(action, this.node));
    }
  }

  public ngDoCheck() {
    if (this._nodeDiffer.diff(this.node.data)) {
      this.actions.forEach((action) => {
        action.items.forEach((item) => {
          item.update(this.node);
        });
      })
    }
  }
}
