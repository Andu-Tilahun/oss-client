import {CommonModule} from '@angular/common';
import {Component, Input} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {FarmPlot} from '../../../farm-plots/models/farm-plot.model';
import {FarmActivity, FarmOperationCreateRequest, WaterSource} from '../../models/farm-crowdfunding.model';

@Component({
  selector: 'app-crowdfunding-operation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crowdfunding-operation-form.component.html',
  styleUrl: './crowdfunding-operation-form.component.css',
})
export class CrowdfundingOperationFormComponent {
  @Input() farmPlots: FarmPlot[] = [];
  @Input() disabled = false;

  form: FormGroup;

  activities: FarmActivity[] = ['CROPS', 'LIVE_STOCKS', 'AGRO_FORESTRY'];
  waterSources: WaterSource[] = ['IRRIGATION', 'RIVER_ACCESS', 'RAIN_FED'];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      farmPlotId: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      farmActivity: ['CROPS', Validators.required],
      waterSource: ['RAIN_FED', Validators.required],
    });
  }

  isValid(): boolean {
    return this.form.valid;
  }

  markAllAsTouched(): void {
    this.form.markAllAsTouched();
  }

  getValue(): FarmOperationCreateRequest {
    const v = this.form.value;
    return {
      farmPlotId: v.farmPlotId,
      startDate: v.startDate,
      endDate: v.endDate,
      farmActivity: v.farmActivity,
      waterSource: v.waterSource,
    };
  }
}

