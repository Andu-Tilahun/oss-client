import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {ToastService} from '../../../../shared/toast/toast.service';
import {InvestmentPackageService} from '../../services/investment-package.service';
import {InvestmentPackage, InvestmentCreateRequest, InvestmentPaymentMethod} from '../../models/investment-package.model';
import {DocumentUploadComponent} from '../../../../shared/file-upload/document-upload/document-upload.component';

@Component({
  selector: 'app-investment-package-create-investment-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ReactiveFormsModule, DocumentUploadComponent],
  templateUrl: './investment-package-create-investment-modal.component.html',
})
export class InvestmentPackageCreateInvestmentModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() investmentCreated = new EventEmitter<void>();
  @Input() investmentPackage: InvestmentPackage | null = null;
  @Input() leasePaymentMode = false;

  isSaving = false;
  attachmentId: string | null = null;
  form: FormGroup;
  paymentMethods: InvestmentPaymentMethod[] = ['CREDIT', 'BANK_TRANSFER', 'CRYPTO'];

  constructor(
    private fb: FormBuilder,
    private investmentPackageService: InvestmentPackageService,
    private toastService: ToastService,
  ) {
    this.form = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      paymentMethod: ['BANK_TRANSFER', Validators.required],
    });
  }

  get modalTitle(): string {
    return this.leasePaymentMode ? 'Confirm Payment' : 'Create Investment';
  }

  get confirmLabel(): string {
    return this.leasePaymentMode ? 'Paid' : 'Confirm';
  }

  get isConfirmDisabled(): boolean {
    if (this.isSaving) {
      return true;
    }
    if (this.leasePaymentMode) {
      return !this.attachmentId;
    }
    return false;
  }

  formatAmount(value: number | undefined): string {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(value);
  }

  onProofUploaded(fileId: string): void {
    this.attachmentId = fileId;
  }

  onProofRemoved(): void {
    this.attachmentId = null;
  }

  onSubmit(): void {
    if (!this.investmentPackage?.id) return;

    if (this.leasePaymentMode) {
      this.submitLeasePayment();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    const request: InvestmentCreateRequest = {
      crowdFundingId: this.investmentPackage.id,
      amount: Number(v.amount),
      paymentMethod: v.paymentMethod,
    };

    this.isSaving = true;
    this.investmentPackageService.createInvestment(request).subscribe({
      next: () => {
        this.isSaving = false;
        this.toastService.success('Investment created successfully');
        this.closeModal();
        this.investmentCreated.emit();
        this.form.reset({amount: null, paymentMethod: 'BANK_TRANSFER'});
      },
      error: (error) => {
        this.isSaving = false;
        this.toastService.error(error.message || 'Failed to create investment', 'Create Investment');
      },
    });
  }

  private submitLeasePayment(): void {
    if (!this.investmentPackage?.id || !this.attachmentId) {
      this.toastService.error('Please upload payment proof before continuing', 'Confirm Payment');
      return;
    }

    this.isSaving = true;
    this.investmentPackageService.createInvestmentRecord({
      investmentPackageId: this.investmentPackage.id,
      amount: this.investmentPackage.targetAmount,
      paymentMethod: 'CREDIT',
      attachmentId: this.attachmentId,
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.toastService.success('Payment recorded successfully');
        this.closeModal();
        this.investmentCreated.emit();
        this.resetLeasePaymentState();
      },
      error: (error) => {
        this.isSaving = false;
        this.toastService.error(error.message || 'Failed to record payment', 'Confirm Payment');
      },
    });
  }

  onCancel(): void {
    this.form.reset();
    this.resetLeasePaymentState();
  }

  private closeModal(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  private resetLeasePaymentState(): void {
    this.attachmentId = null;
  }
}
