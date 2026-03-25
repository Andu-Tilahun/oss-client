import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {RepeaterComponent} from '../../../../shared/repeater/repeater/repeater.component';
import {
  FarmLeasePaymentLine,
  LeaseAgreement,
  LeaseCreateRequest,
  LeaseDefineTermsRequest,
  LeaseTerm,
} from '../../models/farm-lease.model';

@Component({
  selector: 'app-farm-lease-payment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RepeaterComponent],
  templateUrl: './farm-lease-payment-form.component.html',
  styleUrls: ['./farm-lease-payment-form.component.css'],
})
export class FarmLeasePaymentFormComponent implements OnInit, OnChanges {
  @Input() leaseDetails: LeaseCreateRequest | null = null;
  @Input() lease: LeaseAgreement | null = null;
  @Input() readOnly = false;

  form!: FormGroup;

  private lastLeaseDetailsSeed = '';

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      payments: this.fb.array([]),
    });
    this.tryRebuild();
    this.applyReadOnly();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.form) return;

    if (changes['lease']) {
      this.lastLeaseDetailsSeed = '';
      this.tryRebuild();
    } else if (changes['leaseDetails'] && this.leaseDetails) {
      const seed = this.leaseDetailsSeed();
      if (seed !== this.lastLeaseDetailsSeed) {
        this.lastLeaseDetailsSeed = seed;
        this.tryRebuild();
      }
    }

    if (changes['readOnly']) {
      this.applyReadOnly();
    }
  }

  get payments(): FormArray {
    return this.form.get('payments') as FormArray;
  }

  createRow(dueDate: string, amount: number): FormGroup {
    return this.fb.group({
      dueDate: [dueDate, Validators.required],
      amount: [amount, [Validators.required, Validators.min(0.0001)]],
    });
  }

  addPayment(): void {
    const last = this.payments.at(this.payments.length - 1) as FormGroup | undefined;
    const base = last?.get('dueDate')?.value as string | undefined;
    const nextDue = base
      ? this.addOneMonth(base)
      : (this.leaseDetails?.startDate ?? '');
    this.payments.push(this.createRow(nextDue, 0.01));
  }

  removePayment(index: number): void {
    this.payments.removeAt(index);
  }

  get sumOfAmounts(): number {
    let s = 0;
    for (const c of this.payments.controls) {
      s += Number((c as FormGroup).get('amount')?.value) || 0;
    }
    return Math.round(s * 10000) / 10000;
  }

  get amountMismatch(): boolean {
    if (!this.leaseDetails) return false;
    const target = Math.round(this.leaseDetails.totalAmount * 10000) / 10000;
    return Math.abs(this.sumOfAmounts - target) > 0.0001;
  }

  isValid(): boolean {
    return this.form.valid && this.payments.length > 0 && !this.amountMismatch;
  }

  markAllAsTouched(): void {
    this.payments.controls.forEach((c) => (c as FormGroup).markAllAsTouched());
  }

  getValue(): LeaseDefineTermsRequest {
    const terms: FarmLeasePaymentLine[] = this.payments.controls.map((c) => {
      const g = c as FormGroup;
      return {
        dueDate: g.get('dueDate')?.value as string,
        amount: Number(g.get('amount')?.value),
      };
    });
    return {terms};
  }

  getPreviewTerms(): LeaseTerm[] {
    return this.payments.controls.map((c) => {
      const g = c as FormGroup;
      const due = g.get('dueDate')?.value as string;
      const amount = Number(g.get('amount')?.value);
      return {
        id: '',
        scheduledDate: due,
        dueDate: due,
        amount,
        paidDate: undefined,
        status: 'ACTIVE' as const,
      };
    });
  }

  private tryRebuild(): void {
    if (!this.leaseDetails) {
      this.payments.clear();
      return;
    }

    if (this.lease?.terms?.length) {
      this.payments.clear();
      for (const t of this.lease.terms) {
        this.payments.push(this.createRow(t.dueDate, Number(t.amount)));
      }
      return;
    }

    this.payments.clear();
    for (const row of this.buildEqualSplitRows(this.leaseDetails)) {
      this.payments.push(this.createRow(row.dueDate, row.amount));
    }
  }

  private leaseDetailsSeed(): string {
    if (!this.leaseDetails) return '';
    const d = this.leaseDetails;
    return `${d.farmPlotId}-${d.startDate}-${d.totalDurationMonths}-${d.totalAmount}`;
  }

  private buildEqualSplitRows(details: LeaseCreateRequest): FarmLeasePaymentLine[] {
    const months = details.totalDurationMonths;
    const total = details.totalAmount;
    const start = details.startDate;
    const scale = 10000;
    const totalInt = Math.round(total * scale);
    const perTermInt = Math.round(totalInt / months);
    const remainderInt = totalInt - perTermInt * months;
    const perTerm = perTermInt / scale;
    const remainder = remainderInt / scale;
    const lines: FarmLeasePaymentLine[] = [];
    for (let i = 0; i < months; i++) {
      const dt = new Date(start);
      dt.setMonth(dt.getMonth() + i);
      const dateStr = dt.toISOString().slice(0, 10);
      const amount = i === months - 1 ? perTerm + remainder : perTerm;
      lines.push({dueDate: dateStr, amount});
    }
    return lines;
  }

  private addOneMonth(isoDate: string): string {
    const d = new Date(isoDate);
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  }

  private applyReadOnly(): void {
    if (!this.form) return;
    if (this.readOnly) {
      this.form.disable({emitEvent: false});
    } else {
      this.form.enable({emitEvent: false});
    }
  }
}
