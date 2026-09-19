import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {FarmPlot} from '../../../farm-plots/models/farm-plot.model';
import {InvestmentPackageTypeAgreement, InvestmentPackageTypeCreateRequest} from '../../models/investment-package-type.model';
import {RepeaterComponent} from "../../../../shared/repeater/repeater/repeater.component";

@Component({
  selector: 'app-investment-package-type-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RepeaterComponent],
  templateUrl: './investment-package-type-form.component.html',
})
export class InvestmentPackageTypeFormComponent implements OnInit, OnChanges {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() agreement: InvestmentPackageTypeAgreement | null = null;
  @Input() farmPlots: FarmPlot[] = [];
  /**
   * When provided (investor selecting a plot from cards), the farm plot selector is hidden
   * and `farmPlotId` is pre-filled.
   */
  @Input() selectedFarmPlot: FarmPlot | null = null;
  @Input() readOnly = false;

  readonly form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      farmPlotId: ['', Validators.required],
      startDate: ['', Validators.required],
      totalDurationMonths: [1, [Validators.required, Validators.min(1)]],
      totalAmount: [0, [Validators.required, Validators.min(0.01)]],
      leasePaymentLineRequests: this.fb.array([]),
    });
  }

  ngOnInit() {
    if (this.mode === 'edit' && this.agreement) {
      this.patchFromAgreement(this.agreement);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['agreement']) {
      if (this.agreement) {
        this.patchFromAgreement(this.agreement);
      }
    }

    // Investor flow: pre-fill the selected plot and hide the selector.
    if (changes['selectedFarmPlot'] && this.selectedFarmPlot && this.mode !== 'edit') {
      this.form.patchValue({farmPlotId: this.selectedFarmPlot.id}, {emitEvent: false});
    }

    // If no plot was pre-selected, default to the first plot (only for create mode).
    if (
      changes['farmPlots'] &&
      this.farmPlots?.length &&
      !this.selectedFarmPlot &&
      !this.form.get('farmPlotId')?.value
    ) {
      this.form.patchValue({farmPlotId: this.farmPlots[0].id}, {emitEvent: false});
    }
    if (changes['readOnly'] || changes['agreement']) {
      this.applyReadOnly();
    }
  }

  get calculatedEndDate(): string | null {
    const start = this.form.get('startDate')?.value as string;
    const months = Number(this.form.get('totalDurationMonths')?.value ?? 0);
    if (!start || months < 1) return null;

    const [y, m, d] = start.split('-').map(Number);
    if (!y || !m || !d) return null;

    const date = new Date(Date.UTC(y, m - 1, d));
    if (months <= 1) {
      return start;
    }
    date.setUTCMonth(date.getUTCMonth() + months - 1);
    return date.toISOString().slice(0, 10);
  }

  isValid(): boolean {
    return this.form.valid;
  }

  getValue(): InvestmentPackageTypeCreateRequest {
    const v = this.form.getRawValue();
    return {
      farmPlotId: v.farmPlotId,
      startDate: v.startDate,
      totalDurationMonths: Number(v.totalDurationMonths),
      totalAmount: Number(v.totalAmount),
      leasePaymentLineRequests: v.leasePaymentLineRequests
    };
  }

  markAllAsTouched(): void {
    Object.keys(this.form.controls).forEach((key) => {
      this.form.get(key)?.markAsTouched();
    });
  }

  reset(): void {
    if (this.agreement) {
      this.patchFromAgreement(this.agreement);
    } else {
      this.form.reset({
        farmPlotId: '',
        startDate: '',
        totalDurationMonths: 1,
        totalAmount: 0,
      });
    }
    this.applyReadOnly();
  }

  private patchFromAgreement(agreement: InvestmentPackageTypeAgreement): void {
    this.form.patchValue(
      {
        farmPlotId: agreement.farmPlotId,
        startDate: agreement.startDate,
        totalDurationMonths: agreement.totalDurationMonths,
        totalAmount: agreement.totalAmount,
      },
      {emitEvent: false},
    );
    this.payments.clear();
    agreement.terms?.forEach(transition => {
      const paymentGroup = this.createPayments();
      paymentGroup.patchValue(transition);
      this.payments.push(paymentGroup);
    });
  }

  get hasPayments(): boolean {
    return this.payments.length > 0;
  }

  createPayments(): FormGroup {
    return this.fb.group({
      dueDate: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.0001)]],
    });
  }

  private applyReadOnly(): void {
    if (this.readOnly) {
      this.form.disable({emitEvent: false});
    } else {
      this.form.enable({emitEvent: false});
    }
  }

  get payments(): FormArray {
    return this.form.get('leasePaymentLineRequests') as FormArray;
  }

  addPayment(): void {
    this.payments.push(this.createPayments());
  }


  removePayment(index: number): void {
    this.payments.removeAt(index);
  }

  hasValidationErrors(): boolean {
    return this.form.invalid;

  }
}
