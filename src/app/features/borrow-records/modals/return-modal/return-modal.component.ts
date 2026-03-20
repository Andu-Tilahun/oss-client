import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/modals/modal/modal.component';
import { ToastService } from '../../../../shared/toast/toast.service';
import { BorrowRecord } from '../../models/borrow-record.model';
import { BorrowRecordService } from '../../services/borrow-record.service';
import { ItemCondition } from '../../../items/models/item.model';

@Component({
  selector: 'app-return-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './return-modal.component.html',
})
export class ReturnModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() returned = new EventEmitter<void>();

  @Input() record: BorrowRecord | null = null;

  isLoading = false;
  conditions: ItemCondition[] = ['New', 'Good', 'Fair', 'Damaged'];
  conditionAtReturn: ItemCondition = 'Good';

  constructor(
    private borrowRecordService: BorrowRecordService,
    private toastService: ToastService
  ) {}

  ngOnChanges(): void {
    this.conditionAtReturn = 'Good';
  }

  onSubmit(): void {
    if (!this.record?.id) return;
    this.isLoading = true;
    this.borrowRecordService
      .returnItem(this.record.id, { conditionAtReturn: this.conditionAtReturn })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.visible = false;
          this.visibleChange.emit(false);
          this.toastService.success('Item returned successfully');
          this.returned.emit();
        },
        error: (err) => {
          this.isLoading = false;
          this.toastService.error(err.message || 'Failed to return item', 'Return');
        },
      });
  }
}

