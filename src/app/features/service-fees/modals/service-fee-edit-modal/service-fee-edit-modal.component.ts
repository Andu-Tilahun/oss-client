import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {ServiceFeeFormComponent} from '../../components/service-fee-form/service-fee-form.component';
import {ServiceFee, ServiceFeeRequest} from '../../models/service-fee.model';
import {ServiceFeeService} from '../../services/service-fee.service';
import {ToastService} from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-service-fee-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, ServiceFeeFormComponent],
  templateUrl: './service-fee-edit-modal.component.html'
})
export class ServiceFeeEditModalComponent {
  @Input() visible = false;
  @Input() serviceFee: ServiceFee | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() serviceFeeUpdated = new EventEmitter<void>();

  @ViewChild('serviceFeeForm') serviceFeeForm!: ServiceFeeFormComponent;

  isLoading = false;

  constructor(private serviceFeeService: ServiceFeeService, private toastService: ToastService) {
  }

  onSubmit(): void {
    if (!this.serviceFeeForm.isValid() || !this.serviceFee) {
      this.serviceFeeForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const request: ServiceFeeRequest = this.serviceFeeForm.getValue();

    this.serviceFeeService.updateServiceFee(this.serviceFee.id, request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.toastService.success(`Service fee updated successfully`);
        this.serviceFeeUpdated.emit();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(
          error.message || 'Failed to update service fee',
          'Update Service Fee'
        );
      }
    });
  }

  onCancel(): void {
    // Form will reset to @Input serviceFee on next open
  }
}

