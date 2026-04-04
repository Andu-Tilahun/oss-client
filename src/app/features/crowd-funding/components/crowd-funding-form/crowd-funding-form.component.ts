import {CommonModule} from '@angular/common';
import {Component, Input} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CrowdFundingCreateRequest, FarmActivity, FundingStatus, WaterSource} from '../../models/crowd-funding.model';
import {FarmPlot} from "../../../farm-plots/models/farm-plot.model";

@Component({
  selector: 'app-crowd-funding-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crowd-funding-form.component.html',
  styleUrl: './crowd-funding-form.component.css',
})
export class CrowdFundingFormComponent {
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

  isValid(): boolean {
    return this.form.valid;
  }

  markAllAsTouched(): void {
    this.form.markAllAsTouched();
  }

  getValue(): CrowdFundingCreateRequest {
    const v = this.form.value;
    return {
      description: "",
      fundingDeadline: "",
      fundingStatus: undefined,
      minimumContribution: 0,
      targetAmount: 0,
      title: "",
      farmPlotId: v.farmPlotId,
      startDate: v.startDate,
      endDate: v.endDate,
      farmActivity: v.farmActivity,
      waterSource: v.waterSource
    };
  }
}

