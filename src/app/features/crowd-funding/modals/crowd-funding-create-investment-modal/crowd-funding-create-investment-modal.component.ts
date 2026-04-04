import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {ToastService} from '../../../../shared/toast/toast.service';
import {CrowdFundingService} from '../../services/crowd-funding.service';
import {CrowdFunding, InvestmentCreateRequest, InvestmentPaymentMethod} from '../../models/crowd-funding.model';

@Component({
  selector: 'app-crowd-funding-create-investment-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ReactiveFormsModule],
  templateUrl: './crowd-funding-create-investment-modal.component.html',
})
export class CrowdFundingCreateInvestmentModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() investmentCreated = new EventEmitter<void>();
  @Input() crowdFunding: CrowdFunding | null = null;
  isLoading = false;

  isSaving = false;
  form: FormGroup;
  paymentMethods: InvestmentPaymentMethod[] = ['CREDIT', 'BANK_TRANSFER', 'CRYPTO'];

  constructor(
    private fb: FormBuilder,
    private crowdfundingService: CrowdFundingService,
    private toastService: ToastService,
  ) {
    this.form = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      paymentMethod: ['BANK_TRANSFER', Validators.required],
    });
  }

  onSubmit(): void {
    if (!this.crowdFunding?.id) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    const request: InvestmentCreateRequest = {
      crowdFundingId: this.crowdFunding.id,
      amount: Number(v.amount),
      paymentMethod: v.paymentMethod,
    };

    this.isSaving = true;
    this.crowdfundingService.createInvestment(request).subscribe({
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

