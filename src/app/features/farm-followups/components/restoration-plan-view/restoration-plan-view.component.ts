import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {FarmPlot} from '../../../farm-plots/models/farm-plot.model';
import {User} from '../../../users/models/user.model';
import {RestorationPlan, RestorationPlanStatus, RestorationPlanUpdateRequest} from '../../models/restoration-plan.model';
import {RestorationPlanService} from '../../services/restoration-plan.service';
import {ToastService} from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-restoration-plan-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './restoration-plan-view.component.html',
})
export class RestorationPlanViewComponent implements OnChanges {
  @Input() plot: FarmPlot | null = null;
  @Input() plan: RestorationPlan | null = null;
  @Input() isAdmin = false;
  @Input() isExtensionWorker = false;
  @Input() currentUserId: string | null = null;
  @Input() currentUser: User | null = null;
  @Input() workers: User[] = [];

  @Output() assignRequested = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  followUpRemark = '';
  issuesEncountered = '';
  status: RestorationPlanStatus = 'ACTIVE';
  submitting = false;

  constructor(
    private restorationPlanService: RestorationPlanService,
    private toastService: ToastService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['plan']) {
      this.followUpRemark = this.plan?.followUpRemark ?? '';
      this.issuesEncountered = this.plan?.issuesEncountered ?? '';
      this.status = this.plan?.status ?? 'ACTIVE';
    }
  }

  get isAssignedToCurrentWorker(): boolean {
    return this.isExtensionWorker && !!this.plan?.assignedTo && !!this.currentUserId
      && this.plan.assignedTo === this.currentUserId;
  }

  private get assignedWorker(): User | null {
    if (!this.plan?.assignedTo) return null;
    if (this.currentUser?.id === this.plan.assignedTo) return this.currentUser;
    return this.workers.find((w) => w.id === this.plan?.assignedTo) ?? null;
  }

  get assignedWorkerName(): string {
    const worker = this.assignedWorker;
    return worker ? `${worker.firstName} ${worker.lastName}` : '-';
  }

  get assignedWorkerEmail(): string {
    return this.assignedWorker?.email ?? '';
  }

  statusPillClass(status: RestorationPlanStatus | undefined): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'RESTORATION_END':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'SUBMITTED':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  onSubmitFollowUp(): void {
    if (!this.plan?.id) return;

    this.submitting = true;
    const request: RestorationPlanUpdateRequest = {
      followUpRemark: this.followUpRemark,
      issuesEncountered: this.issuesEncountered,
      status: this.status,
    };

    this.restorationPlanService.updateByWorker(this.plan.id, request).subscribe({
      next: () => {
        this.submitting = false;
        this.toastService.success('Follow-up updated successfully');
        this.updated.emit();
      },
      error: (err) => {
        this.submitting = false;
        this.toastService.error(err.message || 'Failed to update follow-up', 'Restoration Plan');
      },
    });
  }
}
