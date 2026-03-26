import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {ToastService} from '../../../../shared/toast/toast.service';
import {FarmlandRestorationPlan, RestorationPlanStatus} from '../../models/farm-followups.model';
import {FarmFollowUpsService, RestorationPlanUpdateRequest} from '../../services/farm-followups.service';

@Component({
  selector: 'app-restoration-plan-worker-update-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './restoration-plan-worker-update-modal.component.html',
})
export class RestorationPlanWorkerUpdateModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() updated = new EventEmitter<void>();

  @Input() plan: FarmlandRestorationPlan | null = null;
  @Input() statuses: RestorationPlanStatus[] = ['SUBMITTED', 'ACTIVE', 'RESTORATION_END', 'CANCELLED'];

  confirmLoading = false;
  readonly form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private service: FarmFollowUpsService,
    private toastService: ToastService,
  ) {
    this.form = this.fb.group({
      status: ['SUBMITTED', Validators.required],
      followUpRemark: ['', [Validators.maxLength(500)]],
      issuesEncountered: ['', [Validators.maxLength(500)]],
    });
  }

  ngOnChanges(): void {
    if (!this.plan) return;
    this.form.patchValue({
      status: this.plan.status,
      followUpRemark: this.plan.followUpRemark ?? '',
      issuesEncountered: this.plan.issuesEncountered ?? '',
    }, {emitEvent: false});
  }

  onConfirm(): void {
    if (!this.plan || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload: RestorationPlanUpdateRequest = {
      status: v.status,
      followUpRemark: v.followUpRemark,
      issuesEncountered: v.issuesEncountered,
    };

    this.confirmLoading = true;
    this.service.updateRestorationPlanByWorker(this.plan.id, payload).subscribe({
      next: () => {
        this.confirmLoading = false;
        this.toastService.success('Follow-up updated successfully');
        this.updated.emit();
        this.onCancel();
      },
      error: (error) => {
        this.confirmLoading = false;
        this.toastService.error(error.message || 'Failed to update follow-up');
      },
    });
  }

  onCancel(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}

