import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../shared/modals/modal/modal.component';
import { ToastService } from '../../../../shared/toast/toast.service';
import { BorrowRecord } from '../../../borrow-records/models/borrow-record.model';
import { Item } from '../../../items/models/item.model';
import { ItemService } from '../../../items/services/item.service';
import { ReplacementRecordService } from '../../services/replacement-record.service';
import { ReplacementFormComponent } from '../../components/replacement-form/replacement-form.component';

@Component({
  selector: 'app-replacement-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ReplacementFormComponent],
  templateUrl: './replacement-modal.component.html',
})
export class ReplacementModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirmed = new EventEmitter<void>();

  @Input() record: BorrowRecord | null = null;

  @ViewChild(ReplacementFormComponent) replacementForm?: ReplacementFormComponent;

  isLoading = false;
  queue: Item[] = [];

  constructor(
    private itemService: ItemService,
    private replacementRecordService: ReplacementRecordService,
    private toastService: ToastService
  ) {}

  ngOnChanges(): void {
    this.replacementForm?.reset();
    this.loadQueue();
  }

  loadQueue(): void {
    this.itemService.getReplacementQueue().subscribe({
      next: (list) => (this.queue = list ?? []),
      error: (err) =>
        this.toastService.error(err.message || 'Failed to load replacement queue', 'Replacement'),
    });
  }

  onSubmit(): void {
    if (!this.record?.id) return;
    if (!this.replacementForm) return;
    if (!this.replacementForm.isValid()) {
      this.replacementForm.markAllAsTouched();
      return;
    }
    const v = this.replacementForm.getValue();

    this.isLoading = true;
    this.replacementRecordService
      .confirm({
        oldBorrowRecordId: this.record.id,
        newItemId: v.newItemId,
        reason: v.reason,
        oldItemFinalStatus: v.oldItemFinalStatus,
        notes: v.notes,
      })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.visible = false;
          this.visibleChange.emit(false);
          this.toastService.success('Replacement processed successfully');
          this.confirmed.emit();
        },
        error: (err) => {
          this.isLoading = false;
          this.toastService.error(err.message || 'Failed to process replacement', 'Replacement');
        },
      });
  }

  onCancel(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}

