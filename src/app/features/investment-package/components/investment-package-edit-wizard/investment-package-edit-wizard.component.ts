import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  FarmActivity,
  InvestmentPackage,
  InvestmentPackageCreateRequest,
  InvestmentPackageType,
  InvestmentPaymentMethod,
  WaterSource,
} from '../../models/investment-package.model';
import { FundingStatus, FUNDING_STATUSES } from '../../../../shared/models/funding-status.model';
import { SystemConfigService } from '../../../system-config/services/system-config.service';
import { BankAccount } from '../../../system-config/models/bank-account.model';
import {
  InvestmentPackagePreviewComponent,
  InvestmentPackagePreviewData,
} from '../investment-package-preview/investment-package-preview.component';

function endDateAfterDeadlineValidator(control: AbstractControl): ValidationErrors | null {
  const group = control as FormGroup;
  const endDate = group.get('endDate')?.value as string;
  const fundingDeadline = group.get('fundingDeadline')?.value as string;

  if (endDate && fundingDeadline) {
    const end = new Date(`${endDate}T00:00:00`);
    const deadline = new Date(fundingDeadline);
    if (!isNaN(end.getTime()) && !isNaN(deadline.getTime()) && end.getTime() <= deadline.getTime()) {
      return { endDateAfterDeadline: true };
    }
  }
  return null;
}

@Component({
  selector: 'app-investment-package-edit-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InvestmentPackagePreviewComponent],
  templateUrl: './investment-package-edit-wizard.component.html',
})
export class InvestmentPackageEditWizardComponent implements OnInit, OnChanges {
  @Input() currentStep = 1;
  @Input() investmentPackage: InvestmentPackage | null = null;

  detailsForm: FormGroup;
  datesForm: FormGroup;
  paymentForm: FormGroup;

  bankAccounts: BankAccount[] = [];

  readonly activities: FarmActivity[] = ['CROPS', 'LIVE_STOCKS', 'AGRO_FORESTRY'];
  readonly waterSources: WaterSource[] = ['IRRIGATION', 'RIVER_ACCESS', 'RAIN_FED'];
  readonly allPaymentMethods: InvestmentPaymentMethod[] = ['CREDIT', 'BANK_TRANSFER', 'CRYPTO'];
  readonly statuses: FundingStatus[] = FUNDING_STATUSES;

  constructor(
    private fb: FormBuilder,
    private systemConfigService: SystemConfigService,
  ) {
    this.detailsForm = this.createDetailsForm();
    this.datesForm = this.createDatesForm();
    this.paymentForm = this.createPaymentForm();
  }

  ngOnInit(): void {
    this.systemConfigService.getActiveBankAccounts().subscribe({
      next: (accounts) => { this.bankAccounts = accounts; },
      error: () => {},
    });
    this.applyTypeValidators(this.investmentPackage?.investmentPackageType ?? 'CROWDFUNDING');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['investmentPackage'] && this.investmentPackage) {
      const pkg = this.investmentPackage;
      this.detailsForm.patchValue({
        title: pkg.title,
        farmActivity: pkg.farmActivity,
        waterSource: pkg.waterSource,
        description: pkg.description ?? '',
        remark: pkg.remark ?? '',
      });
      this.datesForm.patchValue({
        startDate: this.toDateInput(pkg.startDate),
        endDate: this.toDateInput(pkg.endDate),
        fundingDeadline: this.toDateTimeLocal(pkg.fundingDeadline),
      });
      this.paymentForm.patchValue({
        targetAmount: pkg.targetAmount,
        minimumContribution: pkg.minimumContribution,
        roiPercent: pkg.roiPercent ?? null,
        fundingStatus: pkg.fundingStatus,
        allowedPaymentMethods: pkg.allowedPaymentMethods?.length ? pkg.allowedPaymentMethods : ['CRYPTO'],
        allowedBankAccountIds: pkg.allowedBankAccountIds ?? [],
      });
      this.applyTypeValidators(pkg.investmentPackageType ?? 'CROWDFUNDING');
    }
  }

  private createDetailsForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      farmActivity: ['CROPS' as FarmActivity, Validators.required],
      waterSource: ['RAIN_FED' as WaterSource, Validators.required],
      description: [''],
      remark: [''],
    });
  }

  private createDatesForm(): FormGroup {
    return this.fb.group(
      {
        startDate: ['', Validators.required],
        endDate: ['', Validators.required],
        fundingDeadline: ['', Validators.required],
      },
      { validators: [endDateAfterDeadlineValidator] },
    );
  }

  private createPaymentForm(): FormGroup {
    return this.fb.group(
      {
        targetAmount: [null, [Validators.required, Validators.min(0.01)]],
        minimumContribution: [null, [Validators.required, Validators.min(0.01)]],
        roiPercent: [null, [Validators.required, Validators.min(0.01)]],
        fundingStatus: [FundingStatus.OPEN, Validators.required],
        allowedPaymentMethods: [['CRYPTO'] as InvestmentPaymentMethod[]],
        allowedBankAccountIds: [[] as string[]],
      },
      { validators: [this.targetMustExceedMinimumValidator.bind(this)] },
    );
  }

  private targetMustExceedMinimumValidator(group: AbstractControl): ValidationErrors | null {
    const type = this.investmentPackage?.investmentPackageType;
    const targetAmount = Number(group.get('targetAmount')?.value);
    const minimumContribution = Number(group.get('minimumContribution')?.value);

    if (type === 'CROWDFUNDING' && targetAmount && minimumContribution && targetAmount <= minimumContribution) {
      return { targetMustExceedMinimum: true };
    }
    return null;
  }

  private applyTypeValidators(type: InvestmentPackageType): void {
    const minimumContribution = this.paymentForm.get('minimumContribution');
    const roiPercent = this.paymentForm.get('roiPercent');

    if (type === 'CROWDFUNDING') {
      minimumContribution?.setValidators([Validators.required, Validators.min(0.01)]);
      roiPercent?.setValidators([Validators.required, Validators.min(0.01)]);
    } else {
      minimumContribution?.clearValidators();
      roiPercent?.clearValidators();
      roiPercent?.setValue(null, { emitEvent: false });
    }

    minimumContribution?.updateValueAndValidity({ emitEvent: false });
    roiPercent?.updateValueAndValidity({ emitEvent: false });
    this.paymentForm.updateValueAndValidity({ emitEvent: false });
  }

  get isCrowdfunding(): boolean {
    return (this.investmentPackage?.investmentPackageType ?? 'CROWDFUNDING') === 'CROWDFUNDING';
  }

  get showBankAccountPicker(): boolean {
    return this.isMethodAllowed('BANK_TRANSFER');
  }

  get previewData(): InvestmentPackagePreviewData {
    const details = this.detailsForm.getRawValue();
    const dates = this.datesForm.getRawValue();
    const payment = this.paymentForm.getRawValue();
    const allowedBankAccountIds: string[] = payment.allowedBankAccountIds ?? [];

    return {
      title: details.title,
      investmentPackageType: this.investmentPackage?.investmentPackageType,
      farmPlotTitle: this.investmentPackage?.farmPlot?.title,
      farmActivity: details.farmActivity,
      waterSource: details.waterSource,
      description: details.description,
      startDate: dates.startDate,
      endDate: dates.endDate,
      fundingDeadline: dates.fundingDeadline,
      targetAmount: payment.targetAmount,
      minimumContribution: payment.minimumContribution,
      roiPercent: payment.roiPercent,
      fundingStatus: payment.fundingStatus,
      allowedPaymentMethods: payment.allowedPaymentMethods,
      allowedBankAccountNames: allowedBankAccountIds
        .map((id) => this.bankAccounts.find((b) => b.id === id)?.bankName)
        .filter((name): name is string => !!name),
    };
  }

  isMethodAllowed(m: InvestmentPaymentMethod): boolean {
    return ((this.paymentForm.get('allowedPaymentMethods')?.value ?? []) as InvestmentPaymentMethod[]).includes(m);
  }

  toggleMethod(m: InvestmentPaymentMethod): void {
    const current: InvestmentPaymentMethod[] = this.paymentForm.get('allowedPaymentMethods')?.value ?? [];
    const updated = current.includes(m) ? current.filter((x) => x !== m) : [...current, m];
    this.paymentForm.get('allowedPaymentMethods')?.setValue(updated);
    if (!updated.includes('BANK_TRANSFER')) {
      this.paymentForm.get('allowedBankAccountIds')?.setValue([]);
    }
  }

  isBankAllowed(id: string): boolean {
    return ((this.paymentForm.get('allowedBankAccountIds')?.value ?? []) as string[]).includes(id);
  }

  toggleBank(id: string): void {
    const current: string[] = this.paymentForm.get('allowedBankAccountIds')?.value ?? [];
    const updated = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    this.paymentForm.get('allowedBankAccountIds')?.setValue(updated);
  }

  formatMethodLabel(m: string): string {
    const labels: Record<string, string> = {
      CREDIT: 'Credit / Direct',
      BANK_TRANSFER: 'Bank Transfer',
      CRYPTO: 'Cryptocurrency',
    };
    return labels[m] ?? m;
  }

  hasDatesError(errorKey: string): boolean {
    return !!this.datesForm.errors?.[errorKey] && (this.datesForm.touched || this.datesForm.dirty);
  }

  hasPaymentError(errorKey: string): boolean {
    return !!this.paymentForm.errors?.[errorKey] && (this.paymentForm.touched || this.paymentForm.dirty);
  }

  isStepValid(step: number): boolean {
    if (step === 1) {
      return this.detailsForm.valid;
    }
    if (step === 2) {
      return this.datesForm.valid;
    }
    if (step === 3) {
      return this.paymentForm.valid;
    }
    return true;
  }

  markStepTouched(step: number): void {
    if (step === 1) {
      this.detailsForm.markAllAsTouched();
    }
    if (step === 2) {
      this.datesForm.markAllAsTouched();
    }
    if (step === 3) {
      this.paymentForm.markAllAsTouched();
    }
  }

  getValue(): InvestmentPackageCreateRequest {
    const details = this.detailsForm.getRawValue();
    const dates = this.datesForm.getRawValue();
    const payment = this.paymentForm.getRawValue();
    const type = this.investmentPackage?.investmentPackageType ?? 'CROWDFUNDING';
    const isCrowdfunding = type === 'CROWDFUNDING';
    const targetAmount = Number(payment.targetAmount);

    return {
      farmPlotId: this.investmentPackage?.farmPlotId ?? '',
      title: details.title,
      startDate: dates.startDate,
      endDate: dates.endDate,
      targetAmount,
      minimumContribution: isCrowdfunding ? Number(payment.minimumContribution) : targetAmount,
      roiPercent: isCrowdfunding ? Number(payment.roiPercent) : null,
      fundingDeadline: new Date(dates.fundingDeadline).toISOString(),
      investmentPackageType: type,
      farmActivity: details.farmActivity,
      waterSource: details.waterSource,
      description: details.description || undefined,
      remark: details.remark || undefined,
      fundingStatus: payment.fundingStatus,
      allowedPaymentMethods: payment.allowedPaymentMethods?.length ? payment.allowedPaymentMethods : ['CRYPTO'],
      allowedBankAccountIds: payment.allowedBankAccountIds ?? [],
    };
  }

  reset(): void {
    this.detailsForm.reset({
      title: '',
      farmActivity: 'CROPS',
      waterSource: 'RAIN_FED',
      description: '',
      remark: '',
    });
    this.datesForm.reset({ startDate: '', endDate: '', fundingDeadline: '' });
    this.paymentForm.reset({
      targetAmount: null,
      minimumContribution: null,
      roiPercent: null,
      fundingStatus: FundingStatus.OPEN,
      allowedPaymentMethods: ['CRYPTO'],
      allowedBankAccountIds: [],
    });
    this.applyTypeValidators('CROWDFUNDING');
  }

  private toDateInput(value: string | null | undefined): string {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }

  private toDateTimeLocal(value: string | null | undefined): string {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return value.slice(0, 16);
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 16);
  }
}
