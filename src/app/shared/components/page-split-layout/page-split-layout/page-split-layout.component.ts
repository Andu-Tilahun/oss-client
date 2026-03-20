import {CommonModule} from '@angular/common';
import {Component, ContentChild, EventEmitter, Input, Output, TemplateRef} from '@angular/core';
import {ActionIconButtonComponent} from '../../action-icons/action-icon-button/action-icon-button.component';

@Component({
  selector: 'app-page-split-layout',
  standalone: true,
  imports: [CommonModule, ActionIconButtonComponent],
  templateUrl: './page-split-layout.component.html',
  styleUrls: ['./page-split-layout.component.css'],
})
export class PageSplitLayoutComponent {
  @Input() leftTitle: string = '';
  @Input() rightTitle: string = '';

  @Input() showLeftTitle = false;
  @Input() showRightTitle = false;

  /**
   * When set, the layout will show default Edit/Close actions
   * and pass this item into `#rightContent` as `$implicit`.
   */
  @Input() rightItem: any = null;
  @Input() rightEmptyMessage = 'Select a row from the table to view details.';

  @Input() showRightEditButton = true;
  @Input() showRightCloseButton = false;

  @Output() rightEdit = new EventEmitter<any>();
  @Output() rightClose = new EventEmitter<void>();

  @ContentChild('leftContent') leftContent?: TemplateRef<unknown>;
  @ContentChild('rightContent') rightContent?: TemplateRef<unknown>;

  protected hasLeft(): boolean {
    return !!this.leftContent;
  }

  protected hasRight(): boolean {
    return !!this.rightContent;
  }

  protected hasRightItem(): boolean {
    return this.rightItem !== null && this.rightItem !== undefined;
  }
}

