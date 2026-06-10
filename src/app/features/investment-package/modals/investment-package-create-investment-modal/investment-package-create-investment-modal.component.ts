import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {ToastService} from '../../../../shared/toast/toast.service';
import {InvestmentPackageService} from '../../services/investment-package.service';
import {InvestmentPackage, InvestmentCreateRequest, InvestmentPaymentMethod} from '../../models/investment-package.model';

@Component({
  selector: 'app-investment-package-create-investment-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ReactiveFormsModule],
  templateUrl: './investment-package-create-investment-modal.component.html',
})
export class InvestmentPackageCreateInvestmentModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() investmentCreated = new EventEmitter<void>();
  @Input() investmentPackage: InvestmentPackage | null = null;
  isLoading = false;

  isSaving = false;
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

  onSubmit(): void {
    if (!this.investmentPackage?.id) return;
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
        this.visible = false;
        this.visibleChange.emit(false);
        this.investmentCreated.emit();
        this.form.reset({amount: null, paymentMethod: 'BANK_TRANSFER'});
      },
      error: (error) => {
        this.isSaving = false;
        this.toastService.error(error.message || 'Failed to create investment', 'Create Investment');
      },
    });
  }

  onCancel(): void {
    this.form.reset();
  }
}

