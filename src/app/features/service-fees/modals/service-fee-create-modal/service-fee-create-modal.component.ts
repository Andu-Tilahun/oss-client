import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {ServiceFeeFormComponent} from '../../components/service-fee-form/service-fee-form.component';
import {ServiceFeeRequest} from '../../models/service-fee.model';
import {ServiceFeeService} from '../../services/service-fee.service';
import {ToastService} from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-service-fee-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, ServiceFeeFormComponent],
  templateUrl: './service-fee-create-modal.component.html'
})
export class ServiceFeeCreateModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() serviceFeeCreated = new EventEmitter<void>();

  @ViewChild('serviceFeeForm') serviceFeeForm!: ServiceFeeFormComponent;

  isLoading = false;

  constructor(private serviceFeeService: ServiceFeeService, private toastService: ToastService) {
  }

  onSubmit(): void {
    if (!this.serviceFeeForm.isValid()) {
      this.serviceFeeForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const request: ServiceFeeRequest = this.serviceFeeForm.getValue();

    this.serviceFeeService.createServiceFee(request).subscribe({
      next: (result) => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.serviceFeeForm.reset();
        this.toastService.success(`Service fee created successfully`);
        if (result?.previousDeactivated) {
          this.toastService.warning(`Previous active fee for this payment type was inactivated.`, 'Notice');
        }
        this.serviceFeeCreated.emit();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(
          error.message || 'Failed to create service fee',
          'Create Service Fee'
        );
      }
    });
  }

  onCancel(): void {
    this.serviceFeeForm.reset();
  }
}

