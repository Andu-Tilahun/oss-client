import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../shared/modals/modal/modal.component';
import { ToastService } from '../../../../shared/toast/toast.service';
import { BorrowRecord } from '../../../borrow-records/models/borrow-record.model';
import { Employee } from '../../../employees/models/employee.model';
import { EmployeeService } from '../../../employees/services/employee.service';
import { TransferRecordService } from '../../services/transfer-record.service';
import { TransferFormComponent } from '../../components/transfer-form/transfer-form.component';

@Component({
  selector: 'app-transfer-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, TransferFormComponent],
  templateUrl: './transfer-modal.component.html',
})
export class TransferModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() transferred = new EventEmitter<void>();

  @Input() record: BorrowRecord | null = null;

  @ViewChild(TransferFormComponent) transferForm?: TransferFormComponent;

  isLoading = false;
  employees: Employee[] = [];

  constructor(
    private employeeService: EmployeeService,
    private transferRecordService: TransferRecordService,
    private toastService: ToastService
  ) {}

  ngOnChanges(): void {
    this.transferForm?.reset();
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.employeeService.getAllActive().subscribe({
      next: (list) => (this.employees = list ?? []),
      error: (err) => this.toastService.error(err.message || 'Failed to load employees', 'Transfer'),
    });
  }

  onSubmit(): void {
    if (!this.record?.itemId || !this.record?.employeeId) return;
    if (!this.transferForm) return;
    if (!this.transferForm.isValid()) {
      this.transferForm.markAllAsTouched();
      return;
    }
    const v = this.transferForm.getValue();
    this.isLoading = true;
    this.transferRecordService
      .transfer({
        itemId: this.record.itemId,
        fromEmployeeId: this.record.employeeId,
        toEmployeeId: v.toEmployeeId,
        notes: v.notes,
      })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.visible = false;
          this.visibleChange.emit(false);
          this.toastService.success('Transfer completed successfully');
          this.transferred.emit();
        },
        error: (err) => {
          this.isLoading = false;
          this.toastService.error(err.message || 'Failed to transfer item', 'Transfer');
        },
      });
  }

  onCancel(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}

