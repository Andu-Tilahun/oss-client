import {CommonModule} from '@angular/common';
import {Component, ContentChild, EventEmitter, Input, Output, TemplateRef} from '@angular/core';
import {ActionIconButtonComponent} from '../action-icons/action-icon-button/action-icon-button.component';

@Component({
  selector: 'app-detail-right-pane',
  standalone: true,
  imports: [CommonModule, ActionIconButtonComponent],
  templateUrl: './detail-right-pane.component.html',
})
export class DetailRightPaneComponent {
  @Input() item: any = null;

  @Input() emptyMessage = 'Select a row to view details.';

  @Input() showEditButton = true;
  @Input() showCloseButton = true;

  @Output() edit = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  @ContentChild('detailView') detailViewTpl?: TemplateRef<{ $implicit: any }>;

  onEditClick(): void {
    if (!this.item) return;
    this.edit.emit(this.item);
  }
}

