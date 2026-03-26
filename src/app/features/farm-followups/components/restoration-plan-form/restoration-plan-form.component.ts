import {CommonModule} from '@angular/common';
import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {FarmlandRestorationPlan, RestorationPlanStatus} from '../../models/farm-followups.model';
import {FarmPlot} from '../../../farm-plots/models/farm-plot.model';
import {User} from '../../../users/models/user.model';
import {RestorationPlanCreateRequest, RestorationPlanUpdateRequest} from '../../services/farm-followups.service';

@Component({
  selector: 'app-restoration-plan-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './restoration-plan-form.component.html',
})
export class RestorationPlanFormComponent implements OnChanges {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() plan: FarmlandRestorationPlan | null = null;
  @Input() farmPlots: FarmPlot[] = [];
  @Input() extensionWorkers: User[] = [];
  @Input() statuses: RestorationPlanStatus[] = ['SUBMITTED', 'ACTIVE', 'RESTORATION_END', 'CANCELLED'];

  readonly form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      farmPlotId: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      remark: ['', [Validators.maxLength(500)]],
      assignedTo: [''],
      status: ['SUBMITTED'],
      followUpRemark: ['', [Validators.maxLength(500)]],
      issuesEncountered: ['', [Validators.maxLength(500)]],
      reportDate: [''],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['plan'] || changes['mode']) {
      this.patchFromInputs();
    }
  }

  isValid(): boolean {
    return this.form.valid;
  }

  markAllAsTouched(): void {
    Object.keys(this.form.controls).forEach((key) => this.form.get(key)?.markAsTouched());
  }

  getCreateValue(): RestorationPlanCreateRequest {
    const v = this.form.getRawValue();
    return {
      farmPlotId: v.farmPlotId,
      startDate: this.normalizeLocalDateTime(v.startDate),
      endDate: this.normalizeLocalDateTime(v.endDate),
      remark: v.remark,
      assignedTo: v.assignedTo || undefined,
    };
  }

  getEditValue(): RestorationPlanUpdateRequest {
    const v = this.form.getRawValue();
    return {
      startDate: this.normalizeLocalDateTime(v.startDate),
      endDate: this.normalizeLocalDateTime(v.endDate),
      remark: v.remark,
      assignedTo: v.assignedTo || undefined,
      status: v.status,
      followUpRemark: v.followUpRemark,
      issuesEncountered: v.issuesEncountered,
      reportDate: v.reportDate ? this.normalizeLocalDateTime(v.reportDate) : undefined,
    };
  }

  private patchFromInputs(): void {
    if (this.mode === 'create') {
      this.form.reset({
        farmPlotId: '',
        startDate: '',
        endDate: '',
        remark: '',
        assignedTo: '',
        status: 'SUBMITTED',
        followUpRemark: '',
        issuesEncountered: '',
        reportDate: '',
      }, {emitEvent: false});
      this.form.get('farmPlotId')?.enable({emitEvent: false});
      return;
    }

    if (!this.plan) {
      return;
    }

    this.form.patchValue({
      farmPlotId: this.plan.farmPlotId,
      startDate: this.plan.startDate ? this.plan.startDate.slice(0, 16) : '',
      endDate: this.plan.endDate ? this.plan.endDate.slice(0, 16) : '',
      remark: this.plan.remark ?? '',
      assignedTo: this.plan.assignedTo ?? '',
      status: this.plan.status,
      followUpRemark: this.plan.followUpRemark ?? '',
      issuesEncountered: this.plan.issuesEncountered ?? '',
      reportDate: this.plan.reportDate ? this.plan.reportDate.slice(0, 16) : '',
    }, {emitEvent: false});

    this.form.get('farmPlotId')?.disable({emitEvent: false});
  }

  private normalizeLocalDateTime(dt: string): string {
    if (!dt) return dt;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dt)) return `${dt}:00`;
    return dt;
  }
}

