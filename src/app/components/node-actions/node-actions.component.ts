import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Action } from '../../models/action.model';
import { FlatItemNode } from '../../models/flat-item-node.model';


@Component({
  selector: 'fs-node-actions',
  templateUrl: './node-actions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FsNodeActionsComponent {
  @Input() public actions: Action[];
  @Input() public node: FlatItemNode;
}
