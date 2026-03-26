import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {ToastService} from '../../../../shared/toast/toast.service';
import {FarmPlot} from '../../../farm-plots/models/farm-plot.model';
import {User} from '../../../users/models/user.model';
import {FarmFollowUpsService} from '../../services/farm-followups.service';
import {RestorationPlanFormComponent} from '../../components/restoration-plan-form/restoration-plan-form.component';

@Component({
  selector: 'app-restoration-plan-create-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, RestorationPlanFormComponent],
  templateUrl: './restoration-plan-create-modal.component.html',
})
export class RestorationPlanCreateModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() created = new EventEmitter<void>();

  @Input() farmPlots: FarmPlot[] = [];
  @Input() extensionWorkers: User[] = [];

  @ViewChild(RestorationPlanFormComponent) formComp?: RestorationPlanFormComponent;

  confirmLoading = false;

  constructor(
    private service: FarmFollowUpsService,
    private toastService: ToastService,
  ) {}

  onConfirm(): void {
    if (!this.formComp) return;
    if (!this.formComp.isValid()) {
      this.formComp.markAllAsTouched();
      return;
    }

    this.confirmLoading = true;
    this.service.createRestorationPlan(this.formComp.getCreateValue()).subscribe({
      next: () => {
        this.confirmLoading = false;
        this.toastService.success('Restoration plan created successfully');
        this.created.emit();
        this.onCancel();
      },
      error: (error) => {
        this.confirmLoading = false;
        this.toastService.error(error.message || 'Failed to create restoration plan');
      },
    });
  }

  onCancel(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}

