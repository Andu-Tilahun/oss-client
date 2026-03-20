import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../shared/modals/modal/modal.component';
import { DetailCardComponent } from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import { DetailSectionComponent } from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import { DetailFieldComponent } from '../../../../shared/components/detail-field/detail-field/detail-field.component';
import { BorrowRecord } from '../../models/borrow-record.model';

@Component({
  selector: 'app-borrow-record-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    DetailCardComponent,
    DetailSectionComponent,
    DetailFieldComponent,
  ],
  templateUrl: './borrow-record-detail-modal.component.html',
})
export class BorrowRecordDetailModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() record: BorrowRecord | null = null;
}