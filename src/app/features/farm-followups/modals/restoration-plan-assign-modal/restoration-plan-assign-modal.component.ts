import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {UserService} from '../../../users/services/user.service';
import {User} from '../../../users/models/user.model';
import {RestorationPlanService} from '../../services/restoration-plan.service';
import {ToastService} from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-restoration-plan-assign-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './restoration-plan-assign-modal.component.html',
})
export class RestorationPlanAssignModalComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() farmPlotId: string | null = null;
  /** When set, an unassigned plan already exists for this plot — assign onto it instead of creating a new one. */
  @Input() existingPlanId: string | null = null;

  @Output() assigned = new EventEmitter<void>();

  workers: User[] = [];
  workersLoading = false;
  selectedWorkerId = '';
  startDate = '';
  endDate = '';
  submitting = false;

  constructor(
    private userService: UserService,
    private restorationPlanService: RestorationPlanService,
    private toastService: ToastService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
      this.loadWorkers();
    }
  }

  get canConfirm(): boolean {
    if (!this.selectedWorkerId) return false;
    if (this.existingPlanId) return true;
    return !!this.startDate && !!this.endDate;
  }

  onConfirm(): void {
    if (!this.canConfirm || !this.farmPlotId) return;

    this.submitting = true;
    const call$ = this.existingPlanId
      ? this.restorationPlanService.updateByAdmin(this.existingPlanId, {assignedTo: this.selectedWorkerId})
      : this.restorationPlanService.create({
          farmPlotId: this.farmPlotId,
          startDate: this.toIsoDateTime(this.startDate),
          endDate: this.toIsoDateTime(this.endDate),
          assignedTo: this.selectedWorkerId,
        });

    call$.subscribe({
      next: () => {
        this.submitting = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.toastService.success('Extension worker assigned successfully');
        this.assigned.emit();
      },
      error: (err) => {
        this.submitting = false;
        this.toastService.error(err.message || 'Failed to assign extension worker', 'Assign Extension Worker');
      },
    });
  }

  private resetForm(): void {
    this.selectedWorkerId = '';
    const today = new Date();
    const inThirtyDays = new Date(today.getTime() + 30 * 86400000);
    this.startDate = this.toDateInputValue(today);
    this.endDate = this.toDateInputValue(inThirtyDays);
  }

  private loadWorkers(): void {
    this.workersLoading = true;
    this.userService.getUsersByRole('EXTENSION_WORKER').subscribe({
      next: (users) => {
        this.workers = users;
        this.workersLoading = false;
      },
      error: () => {
        this.workers = [];
        this.workersLoading = false;
      },
    });
  }

  private toDateInputValue(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private toIsoDateTime(dateStr: string): string {
    return `${dateStr}T00:00:00`;
  }
}
