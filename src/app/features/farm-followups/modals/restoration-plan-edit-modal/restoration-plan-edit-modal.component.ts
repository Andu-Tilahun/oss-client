import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {ToastService} from '../../../../shared/toast/toast.service';
import {FarmPlot} from '../../../farm-plots/models/farm-plot.model';
import {User} from '../../../users/models/user.model';
import {FarmFollowUpsService} from '../../services/farm-followups.service';
import {FarmlandRestorationPlan, RestorationPlanStatus} from '../../models/farm-followups.model';
import {RestorationPlanFormComponent} from '../../components/restoration-plan-form/restoration-plan-form.component';

@Component({
  selector: 'app-restoration-plan-edit-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, RestorationPlanFormComponent],
  templateUrl: './restoration-plan-edit-modal.component.html',
})
export class RestorationPlanEditModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() updated = new EventEmitter<void>();

  @Input() plan: FarmlandRestorationPlan | null = null;
  @Input() farmPlots: FarmPlot[] = [];
  @Input() extensionWorkers: User[] = [];
  @Input() statuses: RestorationPlanStatus[] = ['SUBMITTED', 'ACTIVE', 'RESTORATION_END', 'CANCELLED'];

  @ViewChild(RestorationPlanFormComponent) formComp?: RestorationPlanFormComponent;

  confirmLoading = false;

  constructor(
    private service: FarmFollowUpsService,
    private toastService: ToastService,
  ) {}

  onConfirm(): void {
    if (!this.plan || !this.formComp) return;
    if (!this.formComp.isValid()) {
      this.formComp.markAllAsTouched();
      return;
    }

    this.confirmLoading = true;
    this.service.updateRestorationPlanByAdmin(this.plan.id, this.formComp.getEditValue()).subscribe({
      next: () => {
        this.confirmLoading = false;
        this.toastService.success('Restoration plan updated successfully');
        this.updated.emit();
        this.onCancel();
      },
      error: (error) => {
        this.confirmLoading = false;
        this.toastService.error(error.message || 'Failed to update restoration plan');
      },
    });
  }

  onCancel(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}

