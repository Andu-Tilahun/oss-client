import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {FarmPlot} from '../../../farm-plots/models/farm-plot.model';
import {LeaseAgreement, LeaseCreateRequest} from '../../models/farm-lease.model';

@Component({
  selector: 'app-farm-lease-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './farm-lease-form.component.html',
  styleUrls: ['./farm-lease-form.component.css'],
})
export class FarmLeaseFormComponent implements OnChanges {
  @Input() lease: LeaseAgreement | null = null;
  @Input() farmPlots: FarmPlot[] = [];
  @Input() readOnly = false;

  readonly form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      farmPlotId: ['', Validators.required],
      startDate: ['', Validators.required],
      totalDurationMonths: [1, [Validators.required, Validators.min(1)]],
      totalAmount: [0, [Validators.required, Validators.min(0.01)]],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lease']) {
      if (this.lease) {
        this.patchFromLease(this.lease);
      }
    }
    if (changes['farmPlots'] && this.farmPlots?.length && !this.form.get('farmPlotId')?.value) {
      this.form.patchValue({farmPlotId: this.farmPlots[0].id}, {emitEvent: false});
    }
    if (changes['readOnly'] || changes['lease']) {
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

  getValue(): LeaseCreateRequest {
    const v = this.form.getRawValue();
    return {
      farmPlotId: v.farmPlotId,
      startDate: v.startDate,
      totalDurationMonths: Number(v.totalDurationMonths),
      totalAmount: Number(v.totalAmount),
    };
  }

  markAllAsTouched(): void {
    Object.keys(this.form.controls).forEach((key) => {
      this.form.get(key)?.markAsTouched();
    });
  }

  reset(): void {
    if (this.lease) {
      this.patchFromLease(this.lease);
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

  private patchFromLease(lease: LeaseAgreement): void {
    this.form.patchValue(
      {
        farmPlotId: lease.farmPlotId,
        startDate: lease.startDate,
        totalDurationMonths: lease.totalDurationMonths,
        totalAmount: lease.totalAmount,
      },
      {emitEvent: false},
    );
  }

  private applyReadOnly(): void {
    if (this.readOnly) {
      this.form.disable({emitEvent: false});
    } else {
      this.form.enable({emitEvent: false});
    }
  }
}
