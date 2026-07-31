import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {switchMap} from 'rxjs';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {ToastService} from '../../../../shared/toast/toast.service';
import {InvestmentPackageService} from '../../services/investment-package.service';
import {
  InvestmentPackage,
  InvestmentCreateRequest,
  InvestmentPaymentMethod,
  InvestmentRecord,
} from '../../models/investment-package.model';
import {DocumentUploadComponent} from '../../../../shared/file-upload/document-upload/document-upload.component';
import {SystemConfigService} from '../../../system-config/services/system-config.service';
import {BankAccount} from '../../../system-config/models/bank-account.model';

@Component({
  selector: 'app-investment-package-create-investment-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ReactiveFormsModule, DocumentUploadComponent],
  templateUrl: './investment-package-create-investment-modal.component.html',
})
export class InvestmentPackageCreateInvestmentModalComponent implements OnChanges, OnInit {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() investmentCreated = new EventEmitter<void>();
  @Input() investmentPackage: InvestmentPackage | null = null;
  @Input() leasePaymentMode = false;
  @Input() biddingMode = false;
  @Input() existingBidRecord: InvestmentRecord | null = null;

  isSaving = false;
  attachmentId: string | null = null;
  form: FormGroup;
  paymentMethods: InvestmentPaymentMethod[] = ['CREDIT', 'BANK_TRANSFER', 'CRYPTO'];

  bankAccounts: BankAccount[] = [];
  bankAccountsLoading = false;
  placedBidReference: string | null = null;
  placedBidAmount: number | null = null;

  constructor(
    private fb: FormBuilder,
    private investmentPackageService: InvestmentPackageService,
    private systemConfigService: SystemConfigService,
    private toastService: ToastService,
  ) {
    this.form = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      paymentMethod: ['BANK_TRANSFER', Validators.required],
      bankAccountId: [null],
    });
  }

  ngOnInit(): void {
    this.loadBankAccounts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const packageIdChanged = changes['investmentPackage'] &&
      changes['investmentPackage'].previousValue?.id !== changes['investmentPackage'].currentValue?.id;

    if (packageIdChanged || changes['biddingMode'] || changes['existingBidRecord']) {
      this.rebuildAmountValidators();
      if (this.biddingMode && this.existingBidRecord) {
        this.form.patchValue({amount: this.existingBidRecord.amount});
      } else if (this.biddingMode && !this.existingBidRecord && this.investmentPackage) {
        this.form.patchValue({amount: this.investmentPackage.minimumContribution});
      } else if (!this.biddingMode && !this.leasePaymentMode && this.investmentPackage) {
        this.form.patchValue({amount: this.investmentPackage.minimumContribution});
      }
    }
    if (changes['visible']) {
      if (!this.visible) {
        this.form.reset({amount: null, paymentMethod: 'BANK_TRANSFER', bankAccountId: null});
        this.attachmentId = null;
        this.placedBidReference = null;
        this.placedBidAmount = null;
      } else if (this.biddingMode && !this.existingBidRecord && this.investmentPackage) {
        this.form.patchValue({amount: this.investmentPackage.minimumContribution});
      } else if (!this.biddingMode && !this.leasePaymentMode && this.investmentPackage) {
        this.form.patchValue({amount: this.investmentPackage.minimumContribution});
      }
    }
  }

  get modalTitle(): string {
    if (this.placedBidReference) return 'Bid Placed';
    if (this.biddingMode) return this.existingBidRecord ? 'Update Bid' : 'Place Bid';
    if (this.leasePaymentMode) return 'Confirm Payment';
    return `Add ${this.formatPackageType()} Investment`;
  }

  private formatPackageType(): string {
    const type = this.investmentPackage?.investmentPackageType ?? '';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  }

  get confirmLabel(): string {
    if (this.placedBidReference) return 'Close';
    if (this.biddingMode) return this.existingBidRecord ? 'Update' : 'Place Bid';
    return this.leasePaymentMode ? 'Paid' : 'Confirm';
  }

  get isConfirmDisabled(): boolean {
    if (this.isSaving) return true;
    if (this.leasePaymentMode) return !this.attachmentId;
    return false;
  }

  get minimumContribution(): number {
    return this.investmentPackage?.minimumContribution ?? 0;
  }

  get selectedBankAccount(): BankAccount | null {
    const id = this.form.get('bankAccountId')?.value;
    return this.bankAccounts.find(b => b.id === id) ?? null;
  }

  get isTransfer(): boolean {
    return this.form.get('paymentMethod')?.value === 'BANK_TRANSFER';
  }

  formatAmount(value: number | undefined | null): string {
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
    if (this.placedBidReference) {
      this.closeModal();
      return;
    }

    if (!this.investmentPackage?.id) return;

    if (this.leasePaymentMode) {
      this.submitLeasePayment();
      return;
    }

    if (this.biddingMode) {
      this.submitBid();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    const request: InvestmentCreateRequest = {
      investmentPackageId: this.investmentPackage.id,
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
        this.form.reset({amount: null, paymentMethod: 'BANK_TRANSFER', bankAccountId: null});
      },
      error: (error) => {
        this.isSaving = false;
        this.toastService.error(error.message || 'Failed to create investment', 'Create Investment');
      },
    });
  }

  onCancel(): void {
    this.form.reset({amount: null, paymentMethod: 'BANK_TRANSFER', bankAccountId: null});
    this.attachmentId = null;
    this.placedBidReference = null;
    this.placedBidAmount = null;
  }

  private loadBankAccounts(): void {
    this.bankAccountsLoading = true;
    this.systemConfigService.getActiveBankAccounts().subscribe({
      next: accounts => {
        this.bankAccounts = accounts;
        this.bankAccountsLoading = false;
      },
      error: () => {
        this.bankAccountsLoading = false;
      },
    });
  }

  private submitBid(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;

    if (v.paymentMethod === 'BANK_TRANSFER' && !v.bankAccountId) {
      this.toastService.error('Please select a bank account to transfer to', 'Bank Account Required');
      return;
    }

    const createRequest: InvestmentCreateRequest = {
      investmentPackageId: this.investmentPackage!.id,
      amount: Number(v.amount),
      paymentMethod: v.paymentMethod,
      bankAccountId: v.paymentMethod === 'BANK_TRANSFER' ? v.bankAccountId : undefined,
    };

    this.isSaving = true;

    if (this.existingBidRecord) {
      this.investmentPackageService.cancel(this.existingBidRecord.id).pipe(
        switchMap(() => this.investmentPackageService.createInvestment(createRequest)),
      ).subscribe({
        next: (response) => {
          this.isSaving = false;
          if (v.paymentMethod === 'BANK_TRANSFER' && response?.data?.paymentReference) {
            this.placedBidReference = response.data.paymentReference;
            this.placedBidAmount = Number(v.amount);
            this.investmentCreated.emit();
          } else {
            this.toastService.success('Bid updated successfully');
            this.closeModal();
            this.investmentCreated.emit();
          }
        },
        error: (error) => {
          this.isSaving = false;
          this.toastService.error(error.message || 'Failed to update bid', 'Update Bid');
        },
      });
    } else {
      this.investmentPackageService.createInvestment(createRequest).subscribe({
        next: (response) => {
          this.isSaving = false;
          if (v.paymentMethod === 'BANK_TRANSFER' && response?.data?.paymentReference) {
            this.placedBidReference = response.data.paymentReference;
            this.placedBidAmount = Number(v.amount);
            this.investmentCreated.emit();
          } else {
            this.toastService.success('Bid placed successfully');
            this.closeModal();
            this.investmentCreated.emit();
          }
        },
        error: (error) => {
          this.isSaving = false;
          this.toastService.error(error.message || 'Failed to place bid', 'Place Bid');
        },
      });
    }
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
        this.attachmentId = null;
      },
      error: (error) => {
        this.isSaving = false;
        this.toastService.error(error.message || 'Failed to record payment', 'Confirm Payment');
      },
    });
  }

  private rebuildAmountValidators(): void {
    const minBid = this.biddingMode ? (this.investmentPackage?.minimumContribution ?? 0.01) : 0.01;
    if (this.biddingMode) {
      const aboveMin = (control: AbstractControl) => {
        const v = Number(control.value);
        return !isNaN(v) && v > minBid ? null : {aboveMin: true};
      };
      this.form.get('amount')?.setValidators([Validators.required, aboveMin]);
    } else {
      this.form.get('amount')?.setValidators([Validators.required, Validators.min(minBid)]);
    }
    this.form.get('amount')?.updateValueAndValidity();
  }

  private closeModal(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
