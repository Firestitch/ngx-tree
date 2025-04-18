import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import { FilterConfig } from '@firestitch/filter';

import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import { FsTreeNodeDirective } from '../../directives/tree-node.directive';
import { FsTreeAction } from '../../interfaces/action.interface';
import { ITreeConfig } from '../../interfaces/config.interface';
import { FlatItemNode } from '../../models/flat-item-node.model';
import { ItemNode } from '../../models/item-node.model';
import { LoggerService } from '../../services/logger.service';
import { FsTreeDatabaseService } from '../../services/tree-database.service';
import { FsTreeService } from '../../services/tree.service';


@Component({
  selector: 'fs-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.scss'],
  providers: [FsTreeDatabaseService, LoggerService],
  viewProviders: [FsTreeService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FsTreeComponent<T> implements OnInit, OnDestroy {

  @Input()
  public config: ITreeConfig<T> = {};

  public filterConfig: FilterConfig;

  @ViewChild('emptyItem')
  public emptyItem: ElementRef;

  // Template for node
  @ContentChild(FsTreeNodeDirective)
  public treeNodeData: FsTreeNodeDirective;

  // List of actions for tree
  public actions: FsTreeAction[] = [];

  // Nodes can be dragged&dropped. Draggable flag
  public reorder = true;

  // Possibility to expand/collapse for nodes
  public blocked = false;

  public rootChildrenExist$: Observable<boolean>;

  private _destroy$ = new Subject<void>();

  private _search$ = new Subject<string>();

  constructor(
    public tree: FsTreeService<T>,
    private _el: ElementRef,
    private _cd: ChangeDetectorRef,
  ) {
    this.rootChildrenExist$ = this.tree.dataChange$
      .pipe(
        map((value) => {
          return value
            .some((node) => !!node.children && node.children.length > 0);
        }),
      );
  }

  public ngOnInit() {
    this.tree.init(this._el, this.config);
    this.actions = this.config.actions || [];

    if (this.config.filters?.length) {
      this.filterConfig = {
        change: (query) => {
          this.tree.filterVisibleNodes(query.keyword);
        },
        items: this.config.filters,
      };
    }
  }

  public ngOnDestroy() {
    this._destroy$.next(null);
    this._destroy$.complete();
  }

  public hasChild(_: number, _nodeData: FlatItemNode): boolean {
    return _nodeData.expandable;
  }

  /**
   * Collapse nodes
   */
  public collapseAll() {
    this.tree.collapseAll();
  }

  /**
   * Expand nodes
   */
  public expandAll() {
    this.tree.expandAll();
  }

  /**
   * Enable drag&drop
   */
  public enableReorder() {
    this.reorder = true;

    this._cd.markForCheck();
  }

  /**
   * Disable drag&drop
   */
  public disableReorder() {
    this.reorder = false;

    this._cd.markForCheck();
  }

  public unselectAll() {
    this.tree.unselectAll();

    this._cd.markForCheck();
  }

  /**
   * Insert node above target
   *
   * @param data
   * @param target
   */
  public insertAbove(data: any = {}, target: FlatItemNode = null): FlatItemNode {
    return this.tree.insertNodeAbove(data, target);
  }

  /**
   * Insert node below target
   *
   * @param data
   * @param target
   */
  public insertBelow(data: any = {}, target: FlatItemNode = null): FlatItemNode {
    return this.tree.insertNodeBelow(data, target);
  }

  /**
   * Insert node as child element for target node
   *
   * @param data
   * @param parent
   */
  public append(data: any = {}, parent: FlatItemNode = null): FlatItemNode {
    return this.tree.appendNode(data, parent);
  }

  /**
   * Update internal data for target
   *
   * @param data
   * @param target
   */
  public updateNodeData(data: any = {}, target: FlatItemNode) {
    this.tree.updateNodeData(data, target);
  }

  /**
   * Remove node from DB
   *
   * @param item
   */
  public remove(item: FlatItemNode) {
    this.tree.removeNode(item);
  }

  /**
   * Do reorder for target
   *
   * @param target
   */
  public updateSort(target: ItemNode) {
    this.tree.updateSort(target);
  }

  /**
   * Disabled reorder and block tree
   */
  public lockTree() {
    this.disableReorder();
    this.blocked = true;

    this._cd.markForCheck();
  }

  /**
   * Enable reorder back and unlock tree
   */
  public unlockTree() {
    this.enableReorder();
    this.blocked = false;

    this._cd.markForCheck();
  }

  /**
   * Update classes for all nodes
   */
  public updateNodesClasses(): void {
    this.tree.updateNodesClasses();
  }

  public getData() {
    return this.tree.getData();
  }

  public getNodes(rootNode?: FlatItemNode): FlatItemNode[] {
    return this.tree.getChildrenNodes(rootNode);
  }

  public getSiblingNodes(rootNode?: FlatItemNode): FlatItemNode[] {
    return this.tree.getSiblingNodes(rootNode);
  }

  public setData(data: unknown): void {
    this.tree.setData(data);
  }

  public nodeClick(node: FlatItemNode): void {
    this.tree.nodeClick(node);
  }

}
