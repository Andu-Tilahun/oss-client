import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../shared/modals/modal/modal.component';
import { ToastService } from '../../../../shared/toast/toast.service';
import { BorrowRecordService } from '../../services/borrow-record.service';
import {Item, ItemStatus} from '../../../items/models/item.model';
import { BorrowFormComponent } from '../../components/borrow-form/borrow-form.component';
import {ItemService} from "../../../items/services/item.service";

@Component({
  selector: 'app-borrow-create-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, BorrowFormComponent],
  templateUrl: './borrow-create-modal.component.html',
})
export class BorrowCreateModalComponent implements OnInit{
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() borrowCreated = new EventEmitter<void>();

  @Input({ required: true }) employeeId!: string;
  @Input() availableItems: Item[] = [];

  @ViewChild(BorrowFormComponent) form!: BorrowFormComponent;

  isLoading = false;
  loadingAvailable = false;

  constructor(
    private borrowRecordService: BorrowRecordService,
    private itemService: ItemService,
    private toastService: ToastService
  ) {}

  onSubmit(): void {
    if (!this.form.isValid()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const v = this.form.getValue();

    this.borrowRecordService
      .borrow({
        employeeId: this.employeeId,
        itemId: v.itemId,
        conditionAtBorrow: v.conditionAtBorrow,
      })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.visible = false;
          this.visibleChange.emit(false);
          this.form.reset();
          this.toastService.success('Borrow created successfully');
          this.borrowCreated.emit();
          this.loadAvailableItems();
        },
        error: (err) => {
          this.isLoading = false;
          this.toastService.error(err.message || 'Failed to borrow item', 'Borrow');
        },
      });
  }

  onCancel(): void {
    this.form.reset();
  }

  ngOnInit(): void {
    this.loadAvailableItems();
  }

  loadAvailableItems(): void {
    this.loadingAvailable = true;
    this.itemService
      .filter({
        statuses: ['Available' as ItemStatus],
        sortBy: 'serialNumber',
        sortDirection: 'ASC',
        page: 0,
        size: 200,
      })
      .subscribe({
        next: (res) => {
          this.availableItems = res?.content ?? [];
          this.loadingAvailable = false;
        },
        error: () => {
          this.loadingAvailable = false;
        },
      });
  }
}

