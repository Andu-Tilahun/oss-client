import {CommonModule} from '@angular/common';
import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {Subscription} from 'rxjs';
import {
  FarmActivity,
  InvestmentPackage,
  InvestmentPackageCreateRequest,
  InvestmentPackageType,
  InvestmentPaymentMethod,
  WaterSource,
} from '../../models/investment-package.model';
import {FundingStatus, FUNDING_STATUSES} from '../../../../shared/models/funding-status.model';
import {FarmPlot} from '../../../farm-plots/models/farm-plot.model';
import {SystemConfigService} from '../../../system-config/services/system-config.service';
import {BankAccount} from '../../../system-config/models/bank-account.model';

@Component({
  selector: 'app-investment-package-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './investment-package-form.component.html',
  styleUrl: './investment-package-form.component.css',
})
export class InvestmentPackageFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() investmentPackage: InvestmentPackage | null = null;
  @Input() disabled = false;
  @Input() farmPlots: FarmPlot[] = [];

  form: FormGroup;
  statuses: FundingStatus[] = FUNDING_STATUSES;
  packageTypes: InvestmentPackageType[] = ['CROWDFUNDING', 'BIDDING', 'LEASING'];
  activities: FarmActivity[] = ['CROPS', 'LIVE_STOCKS', 'AGRO_FORESTRY'];
  waterSources: WaterSource[] = ['IRRIGATION', 'RIVER_ACCESS', 'RAIN_FED'];
  readonly allPaymentMethods: InvestmentPaymentMethod[] = ['CREDIT', 'BANK_TRANSFER', 'CRYPTO'];
  bankAccounts: BankAccount[] = [];

  private typeSubscription?: Subscription;

  constructor(private fb: FormBuilder, private systemConfigService: SystemConfigService) {
    this.form = this.fb.group(
      {
        farmPlotId: ['', Validators.required],
        investmentPackageType: ['CROWDFUNDING' as InvestmentPackageType, Validators.required],
        startDate: ['', Validators.required],
        endDate: ['', Validators.required],
        farmActivity: ['CROPS', Validators.required],
        waterSource: ['RAIN_FED', Validators.required],
        title: ['', [Validators.required, Validators.maxLength(100)]],
        targetAmount: [null, [Validators.required, Validators.min(0.01)]],
        minimumContribution: [null, [Validators.required, Validators.min(0.01)]],
        roiPercent: [null, [Validators.required, Validators.min(0.01)]],
        fundingDeadline: ['', Validators.required],
        fundingStatus: [FundingStatus.OPEN, Validators.required],
        description: [''],
        remark: [''],
        allowedPaymentMethods: [['CRYPTO']],
        allowedBankAccountIds: [[]],
      },
      {validators: [investmentPackageFormValidator]},
    );
  }

  ngOnInit(): void {
    this.typeSubscription = this.form.get('investmentPackageType')?.valueChanges.subscribe((type) => {
      this.applyTypeValidators(type as InvestmentPackageType);
    });
    this.applyTypeValidators(this.form.get('investmentPackageType')?.value as InvestmentPackageType);
    this.systemConfigService.getActiveBankAccounts().subscribe({
      next: (accounts) => { this.bankAccounts = accounts; },
      error: () => {},
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['investmentPackage'] && this.investmentPackage && this.mode === 'edit') {
      const pkg = this.investmentPackage;
      this.form.patchValue({
        farmPlotId: pkg.farmPlotId,
        investmentPackageType: pkg.investmentPackageType ?? 'CROWDFUNDING',
        startDate: this.toDateInput(pkg.startDate),
        endDate: this.toDateInput(pkg.endDate),
        farmActivity: pkg.farmActivity,
        waterSource: pkg.waterSource,
        title: pkg.title,
        targetAmount: pkg.targetAmount,
        minimumContribution: pkg.minimumContribution,
        roiPercent: pkg.roiPercent ?? null,
        fundingDeadline: this.toDateTimeLocal(pkg.fundingDeadline),
        fundingStatus: pkg.fundingStatus,
        description: pkg.description ?? '',
        remark: pkg.remark ?? '',
        allowedPaymentMethods: pkg.allowedPaymentMethods?.length ? pkg.allowedPaymentMethods : ['CRYPTO'],
        allowedBankAccountIds: pkg.allowedBankAccountIds ?? [],
      });
      this.applyTypeValidators(pkg.investmentPackageType ?? 'CROWDFUNDING');
    }
  }

  ngOnDestroy(): void {
    this.typeSubscription?.unsubscribe();
  }

  get isCrowdfunding(): boolean {
    return this.form.get('investmentPackageType')?.value === 'CROWDFUNDING';
  }

  get showBankAccountPicker(): boolean {
    return this.isMethodAllowed('BANK_TRANSFER');
  }

  isMethodAllowed(m: InvestmentPaymentMethod): boolean {
    return ((this.form.get('allowedPaymentMethods')?.value ?? []) as InvestmentPaymentMethod[]).includes(m);
  }

  toggleMethod(m: InvestmentPaymentMethod): void {
    const current: InvestmentPaymentMethod[] = this.form.get('allowedPaymentMethods')?.value ?? [];
    const updated = current.includes(m) ? current.filter(x => x !== m) : [...current, m];
    this.form.get('allowedPaymentMethods')?.setValue(updated);
    if (!updated.includes('BANK_TRANSFER')) {
      this.form.get('allowedBankAccountIds')?.setValue([]);
    }
  }

  isBankAllowed(id: string): boolean {
    return ((this.form.get('allowedBankAccountIds')?.value ?? []) as string[]).includes(id);
  }

  toggleBank(id: string): void {
    const current: string[] = this.form.get('allowedBankAccountIds')?.value ?? [];
    const updated = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    this.form.get('allowedBankAccountIds')?.setValue(updated);
  }

  formatMethodLabel(m: string): string {
    const labels: Record<string, string> = {
      CREDIT: 'Credit / Direct',
      BANK_TRANSFER: 'Bank Transfer',
      CRYPTO: 'Cryptocurrency',
    };
    return labels[m] ?? m;
  }

  hasFormError(errorKey: string): boolean {
    return !!this.form.errors?.[errorKey] && (this.form.touched || this.form.dirty);
  }

  isValid(): boolean {
    return this.form.valid;
  }

  markAllAsTouched(): void {
    this.form.markAllAsTouched();
  }

  getValue(): InvestmentPackageCreateRequest {
    const v = this.form.getRawValue();
    const isCrowdfunding = v.investmentPackageType === 'CROWDFUNDING';
    const targetAmount = Number(v.targetAmount);

    const request: InvestmentPackageCreateRequest = {
      farmPlotId: v.farmPlotId,
      title: v.title,
      startDate: v.startDate,
      endDate: v.endDate,
      targetAmount,
      minimumContribution: isCrowdfunding ? Number(v.minimumContribution) : targetAmount,
      roiPercent: isCrowdfunding ? Number(v.roiPercent) : null,
      fundingDeadline: new Date(v.fundingDeadline).toISOString(),
      investmentPackageType: v.investmentPackageType,
      farmActivity: v.farmActivity,
      waterSource: v.waterSource,
      description: v.description || undefined,
      remark: v.remark || undefined,
      allowedPaymentMethods: v.allowedPaymentMethods?.length ? v.allowedPaymentMethods : ['CRYPTO'],
      allowedBankAccountIds: v.allowedBankAccountIds ?? [],
    };

    if (this.mode === 'edit') {
      request.fundingStatus = v.fundingStatus;
    }

    return request;
  }

  reset(): void {
    this.form.reset({
      farmPlotId: '',
      investmentPackageType: 'CROWDFUNDING',
      startDate: '',
      endDate: '',
      farmActivity: 'CROPS',
      waterSource: 'RAIN_FED',
      title: '',
      targetAmount: null,
      minimumContribution: null,
      roiPercent: null,
      fundingDeadline: '',
      fundingStatus: FundingStatus.OPEN,
      description: '',
      remark: '',
      allowedPaymentMethods: ['CRYPTO'],
      allowedBankAccountIds: [],
    });
    this.applyTypeValidators('CROWDFUNDING');
  }

  private applyTypeValidators(type: InvestmentPackageType): void {
    const minimumContribution = this.form.get('minimumContribution');
    const roiPercent = this.form.get('roiPercent');

    if (type === 'CROWDFUNDING') {
      minimumContribution?.setValidators([Validators.required, Validators.min(0.01)]);
      roiPercent?.setValidators([Validators.required, Validators.min(0.01)]);
    } else {
      minimumContribution?.clearValidators();
      roiPercent?.clearValidators();
      roiPercent?.setValue(null, {emitEvent: false});
    }

    minimumContribution?.updateValueAndValidity({emitEvent: false});
    roiPercent?.updateValueAndValidity({emitEvent: false});
    this.form.updateValueAndValidity({emitEvent: false});
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

function investmentPackageFormValidator(control: AbstractControl): ValidationErrors | null {
  const group = control as FormGroup;
  const type = group.get('investmentPackageType')?.value as InvestmentPackageType;
  const targetAmount = Number(group.get('targetAmount')?.value);
  const minimumContribution = Number(group.get('minimumContribution')?.value);
  const endDate = group.get('endDate')?.value as string;
  const fundingDeadline = group.get('fundingDeadline')?.value as string;
  const errors: ValidationErrors = {};

  if (type === 'CROWDFUNDING' && targetAmount && minimumContribution && targetAmount <= minimumContribution) {
    errors['targetMustExceedMinimum'] = true;
  }

  if (endDate && fundingDeadline) {
    const end = new Date(`${endDate}T00:00:00`);
    const deadline = new Date(fundingDeadline);
    if (!isNaN(end.getTime()) && !isNaN(deadline.getTime()) && end.getTime() <= deadline.getTime()) {
      errors['endDateAfterDeadline'] = true;
    }
  }

  return Object.keys(errors).length ? errors : null;
}
