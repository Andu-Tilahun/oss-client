import { Component, Input, OnInit } from '@angular/core';
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
  InvestmentPackageCreateRequest,
  InvestmentPackageType,
  InvestmentPaymentMethod,
  WaterSource,
} from '../../models/investment-package.model';
import { FarmPlot } from '../../../farm-plots/models/farm-plot.model';
import { InvestmentPackageService } from '../../services/investment-package.service';
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
  selector: 'app-investment-package-create-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InvestmentPackagePreviewComponent],
  templateUrl: './investment-package-create-wizard.component.html',
})
export class InvestmentPackageCreateWizardComponent implements OnInit {
  @Input() currentStep = 1;

  detailsForm: FormGroup;
  datesForm: FormGroup;
  paymentForm: FormGroup;

  farmPlots: FarmPlot[] = [];
  farmPlotsLoading = false;
  bankAccounts: BankAccount[] = [];

  readonly packageTypes: InvestmentPackageType[] = ['CROWDFUNDING', 'BIDDING', 'LEASING'];
  readonly activities: FarmActivity[] = ['CROPS', 'LIVE_STOCKS', 'AGRO_FORESTRY'];
  readonly waterSources: WaterSource[] = ['IRRIGATION', 'RIVER_ACCESS', 'RAIN_FED'];
  readonly allPaymentMethods: InvestmentPaymentMethod[] = ['CREDIT', 'BANK_TRANSFER', 'CRYPTO'];

  constructor(
    private fb: FormBuilder,
    private investmentPackageService: InvestmentPackageService,
    private systemConfigService: SystemConfigService,
  ) {
    this.detailsForm = this.createDetailsForm();
    this.datesForm = this.createDatesForm();
    this.paymentForm = this.createPaymentForm();
  }

  ngOnInit(): void {
    this.loadFarmPlots();
    this.systemConfigService.getActiveBankAccounts().subscribe({
      next: (accounts) => { this.bankAccounts = accounts; },
      error: () => {},
    });

    this.detailsForm.get('investmentPackageType')?.valueChanges.subscribe((type) => {
      this.applyTypeValidators(type as InvestmentPackageType);
    });
    this.applyTypeValidators(this.detailsForm.get('investmentPackageType')?.value as InvestmentPackageType);
  }

  private createDetailsForm(): FormGroup {
    return this.fb.group({
      farmPlotId: ['', Validators.required],
      title: ['', [Validators.required, Validators.maxLength(100)]],
      investmentPackageType: ['CROWDFUNDING' as InvestmentPackageType, Validators.required],
      farmActivity: ['CROPS' as FarmActivity, Validators.required],
      waterSource: ['RAIN_FED' as WaterSource, Validators.required],
      description: [''],
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
        expectedInvestorNumber: [null, [Validators.required, Validators.min(1)]],
        allowedPaymentMethods: [['CRYPTO'] as InvestmentPaymentMethod[]],
        allowedBankAccountIds: [[] as string[]],
      },
      { validators: [this.targetMustExceedMinimumValidator.bind(this)] },
    );
  }

  private targetMustExceedMinimumValidator(group: AbstractControl): ValidationErrors | null {
    const type = this.detailsForm?.get('investmentPackageType')?.value as InvestmentPackageType;
    const targetAmount = Number(group.get('targetAmount')?.value);
    const minimumContribution = Number(group.get('minimumContribution')?.value);

    if (type === 'CROWDFUNDING' && targetAmount && minimumContribution && targetAmount <= minimumContribution) {
      return { targetMustExceedMinimum: true };
    }
    return null;
  }

  private applyTypeValidators(type: InvestmentPackageType): void {
    const minimumContribution = this.paymentForm.get('minimumContribution');
    const expectedInvestorNumber = this.paymentForm.get('expectedInvestorNumber');

    if (type === 'CROWDFUNDING') {
      minimumContribution?.setValidators([Validators.required, Validators.min(0.01)]);
      expectedInvestorNumber?.setValidators([Validators.required, Validators.min(1)]);
    } else {
      minimumContribution?.clearValidators();
      expectedInvestorNumber?.clearValidators();
      expectedInvestorNumber?.setValue(1, { emitEvent: false });
    }

    minimumContribution?.updateValueAndValidity({ emitEvent: false });
    expectedInvestorNumber?.updateValueAndValidity({ emitEvent: false });
    this.paymentForm.updateValueAndValidity({ emitEvent: false });
  }

  private loadFarmPlots(): void {
    this.farmPlotsLoading = true;
    this.investmentPackageService.getEligibleFarmPlots().subscribe({
      next: (plots) => {
        this.farmPlots = plots;
        this.farmPlotsLoading = false;
      },
      error: () => {
        this.farmPlotsLoading = false;
      },
    });
  }

  get isCrowdfunding(): boolean {
    return this.detailsForm.get('investmentPackageType')?.value === 'CROWDFUNDING';
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
      investmentPackageType: details.investmentPackageType,
      farmPlotTitle: this.farmPlots.find((p) => p.id === details.farmPlotId)?.title,
      farmActivity: details.farmActivity,
      waterSource: details.waterSource,
      description: details.description,
      startDate: dates.startDate,
      endDate: dates.endDate,
      fundingDeadline: dates.fundingDeadline,
      targetAmount: payment.targetAmount,
      minimumContribution: payment.minimumContribution,
      expectedInvestorNumber: payment.expectedInvestorNumber,
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
    const isCrowdfunding = details.investmentPackageType === 'CROWDFUNDING';
    const targetAmount = Number(payment.targetAmount);

    return {
      farmPlotId: details.farmPlotId,
      title: details.title,
      startDate: dates.startDate,
      endDate: dates.endDate,
      targetAmount,
      minimumContribution: isCrowdfunding ? Number(payment.minimumContribution) : targetAmount,
      expectedInvestorNumber: isCrowdfunding ? Number(payment.expectedInvestorNumber) : 1,
      fundingDeadline: new Date(dates.fundingDeadline).toISOString(),
      investmentPackageType: details.investmentPackageType,
      farmActivity: details.farmActivity,
      waterSource: details.waterSource,
      description: details.description || undefined,
      allowedPaymentMethods: payment.allowedPaymentMethods?.length ? payment.allowedPaymentMethods : ['CRYPTO'],
      allowedBankAccountIds: payment.allowedBankAccountIds ?? [],
    };
  }

  reset(): void {
    this.detailsForm.reset({
      farmPlotId: '',
      title: '',
      investmentPackageType: 'CROWDFUNDING',
      farmActivity: 'CROPS',
      waterSource: 'RAIN_FED',
      description: '',
    });
    this.datesForm.reset({ startDate: '', endDate: '', fundingDeadline: '' });
    this.paymentForm.reset({
      targetAmount: null,
      minimumContribution: null,
      expectedInvestorNumber: null,
      allowedPaymentMethods: ['CRYPTO'],
      allowedBankAccountIds: [],
    });
    this.applyTypeValidators('CROWDFUNDING');
  }
}
