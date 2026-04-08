import {CommonModule} from '@angular/common';
import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {
  CrowdFunding,
  CrowdFundingCreateRequest,
  FarmActivity,
  FundingStatus,
  WaterSource
} from '../../models/crowd-funding.model';
import {FarmPlot} from "../../../farm-plots/models/farm-plot.model";

@Component({
  selector: 'app-crowd-funding-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crowd-funding-form.component.html',
  styleUrl: './crowd-funding-form.component.css',
})
export class CrowdFundingFormComponent implements OnChanges {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() crowdFunding: CrowdFunding | null = null;
  @Input() disabled = false;
  @Input() farmPlots: FarmPlot[] = [];

  form: FormGroup;
  statuses: FundingStatus[] = ['OPEN', 'CLOSED', 'FUNDED', 'FAILED'];
  activities: FarmActivity[] = ['CROPS', 'LIVE_STOCKS', 'AGRO_FORESTRY'];
  waterSources: WaterSource[] = ['IRRIGATION', 'RIVER_ACCESS', 'RAIN_FED'];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      farmPlotId: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      farmActivity: ['CROPS', Validators.required],
      waterSource: ['RAIN_FED', Validators.required],
      title: ['', [Validators.required, Validators.maxLength(100)]],
      targetAmount: [null, [Validators.required, Validators.min(0.01)]],
      minimumContribution: [null, [Validators.required, Validators.min(0.01)]],
      fundingDeadline: ['', Validators.required],
      fundingStatus: ['OPEN', Validators.required],
      description: [''],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['crowdFunding'] && this.crowdFunding && this.mode === 'edit') {
      const cf = this.crowdFunding;
      this.form.patchValue({
        farmPlotId: cf.farmPlotId,
        startDate: this.toDateInput(cf.startDate),
        endDate: this.toDateInput(cf.endDate),
        farmActivity: cf.farmActivity,
        waterSource: cf.waterSource,
        title: cf.title,
        targetAmount: cf.targetAmount,
        minimumContribution: cf.minimumContribution,
        fundingDeadline: this.toDateTimeLocal(cf.fundingDeadline),
        fundingStatus: cf.fundingStatus,
        description: cf.description ?? '',
      });
    }
  }

  isValid(): boolean {
    return this.form.valid;
  }

  markAllAsTouched(): void {
    this.form.markAllAsTouched();
  }

  getValue(): CrowdFundingCreateRequest {
    const v = this.form.getRawValue();
    return {
      farmPlotId: v.farmPlotId,
      startDate: v.startDate,
      endDate: v.endDate,
      farmActivity: v.farmActivity,
      waterSource: v.waterSource,
      title: v.title,
      targetAmount: v.targetAmount,
      minimumContribution: v.minimumContribution,
      fundingDeadline: v.fundingDeadline,
      fundingStatus: v.fundingStatus,
      description: v.description || undefined,
    };
  }

  reset(): void {
    this.form.reset({
      farmPlotId: '',
      startDate: '',
      endDate: '',
      farmActivity: 'CROPS',
      waterSource: 'RAIN_FED',
      title: '',
      targetAmount: null,
      minimumContribution: null,
      fundingDeadline: '',
      fundingStatus: 'OPEN',
      description: '',
    });
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

