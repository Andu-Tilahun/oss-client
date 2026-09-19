import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {FarmFollowUp, FarmFollowUpOutcomeRequest, FollowUpTaskStatus} from '../../models/farm-followup.model';
import {DeadlineChip, deadlineChip, deadlineClass, formatDate, statusClass} from '../../utils/follow-up-display.util';
import {User} from '../../../users/models/user.model';
import {TabItem} from '../../../../shared/tabs/models/tab-item.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {FarmFollowUpService} from '../../services/farm-followup.service';
import {AuthService} from "../../../auth/services/auth.service";

@Component({
  selector: 'app-farm-followup-list',
  standalone: false,
  templateUrl: './farm-followup-list.component.html',
  styleUrl: './farm-followup-list.component.css',
})
export class FarmFollowUpListComponent implements OnChanges {
  @Input() followUps: FarmFollowUp[] = [];
  loading = false;
  @Input() externalId = '';
  @Input() readOnly = false;

  /**
   * Rendering source of truth, decoupled from the `followUps` input. Angular reassigns
   * `@Input()`-bound properties on every change-detection cycle, and the parent pages never
   * re-fetch their agreement/plot after a follow-up outcome changes — so if the tabs read
   * `followUps` directly, a locally-refreshed list gets stomped back to stale data on the very
   * next tick. This field is only ever set by ngOnChanges (on a genuine externalId switch) or by
   * this component's own refresh, so a local refresh always sticks.
   */
  displayedFollowUps: FarmFollowUp[] = [];
  private lastExternalId: string | null = null;

  showCreateButton = false;
  isPrivilegedUser = false;

  showCreateModal = false;
  showViewModal = false;
  selectedFollowUp: FarmFollowUp | null = null;

  activeSubTab = 'active';
  followUpTabs: TabItem[] = [
    {key: 'active', label: 'Active'},
    {key: 'completed', label: 'Completed'},
  ];

  showOutcomeModal = false;
  outcomeSubmitting = false;
  outcomeAction: 'DONE' | 'EXCLUDED' = 'DONE';
  outcomeReason = '';
  outcomeTarget: FarmFollowUp | null = null;
  isAdminActingOnBehalf = false;

  constructor(
    private farmFollowUpService: FarmFollowUpService,
    private authService: AuthService,
    private toastService: ToastService,
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.externalId && this.externalId !== this.lastExternalId) {
      this.lastExternalId = this.externalId;
      this.displayedFollowUps = this.followUps ?? [];
    }
    this.updateActionVisibility();
  }

  private updateActionVisibility(): void {
    const isWorker = this.authService.isExtensionWorker();
    this.showCreateButton = isWorker && !this.readOnly;
    this.isPrivilegedUser = isWorker || this.authService.isAdmin();
  }

  get activeFollowUps(): FarmFollowUp[] {
    return this.displayedFollowUps.filter((f) => f.taskStatus === 'ACTIVE');
  }

  get completedFollowUps(): FarmFollowUp[] {
    return this.displayedFollowUps.filter((f) => f.taskStatus !== 'ACTIVE');
  }

  /** Mark Done / Mark Excluded are offered on active cards to the admin or the worker who created it. */
  canShowActions(f: FarmFollowUp): boolean {
    return this.isPrivilegedUser && !this.readOnly && f.taskStatus === 'ACTIVE' && this.canActOn(f);
  }

  statusClass(status: FollowUpTaskStatus | undefined): string {
    return statusClass(status);
  }

  deadlineClass(chip: DeadlineChip): string {
    return deadlineClass(chip);
  }

  /** Days left until the follow-up's end date, for active cards only. */
  deadlineChip(f: FarmFollowUp, now: Date = new Date()): DeadlineChip | null {
    return deadlineChip(f, now);
  }

  userName(user: User | null | undefined): string {
    if (!user) return '-';
    return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || '-';
  }

  completedByLabel(f: FarmFollowUp): string {
    return f.completedBy ? this.userName(f.completedByUser) : 'System';
  }

  trackById(_: number, f: FarmFollowUp): string {
    return f.id;
  }

  private canActOn(f: FarmFollowUp): boolean {
    if (this.authService.isAdmin()) return true;
    const currentUserId = this.authService.getCurrentUser()?.id;
    return this.authService.isExtensionWorker() && !!currentUserId && f.createdBy === currentUserId;
  }

  onMarkOutcome(followUp: FarmFollowUp, action: 'DONE' | 'EXCLUDED'): void {
    this.outcomeTarget = followUp;
    this.outcomeAction = action;
    this.outcomeReason = '';
    this.isAdminActingOnBehalf = this.authService.isAdmin()
      && followUp.createdBy !== this.authService.getCurrentUser()?.id;
    this.showOutcomeModal = true;
  }

  /** Mark Done / Excluded picked inside the detail popup: close it and reuse the normal outcome flow. */
  onOutcomeFromDetail(action: 'DONE' | 'EXCLUDED'): void {
    const target = this.selectedFollowUp;
    if (!target || !this.canShowActions(target)) return;
    this.showViewModal = false;
    this.onMarkOutcome(target, action);
  }

  handleOutcomeConfirm(): void {
    if (this.outcomeSubmitting) {
      return; // a request is already in flight
    }
    if (!this.outcomeTarget?.id || !this.outcomeReason.trim()) return;
    this.outcomeSubmitting = true;
    const request: FarmFollowUpOutcomeRequest = {reason: this.outcomeReason.trim()};
    const call$ = this.outcomeAction === 'DONE'
      ? this.farmFollowUpService.completeFollowUp(this.outcomeTarget.id, request)
      : this.farmFollowUpService.excludeFollowUp(this.outcomeTarget.id, request);
    call$.subscribe({
      next: () => {
        this.outcomeSubmitting = false;
        this.showOutcomeModal = false;
        this.toastService.success(`Follow-up marked as ${this.outcomeAction === 'DONE' ? 'Done' : 'Excluded'}`);
        this.onRefresh();
      },
      error: (err) => {
        this.outcomeSubmitting = false;
        this.toastService.error(err.message || 'Failed to update follow-up', 'Follow-up');
      },
    });
  }

  onSearch(): void {
    const id = (this.externalId ?? '').trim();
    if (!id) {
      this.toastService.warning('Please enter External Id', 'Follow Ups');
      return;
    }
    this.loadFollowUps(id);
  }

  onRefresh(): void {
    const id = (this.externalId ?? '').trim();
    if (!id) {
      this.displayedFollowUps = [];
      return;
    }
    this.loadFollowUps(id);
  }

  onAdd(): void {
    const id = (this.externalId ?? '').trim();
    if (!id) {
      this.toastService.warning('Enter External Id first', 'Create Follow Up');
      return;
    }
    this.showCreateModal = true;
  }

  onView(item: FarmFollowUp): void {
    this.selectedFollowUp = {...item};
    this.showViewModal = true;
  }

  onEdit(item: FarmFollowUp): void {
    this.onView(item);
  }

  private loadFollowUps(externalId: string): void {
    this.loading = true;
    this.farmFollowUpService.getByExternalId(externalId).subscribe({
      next: (data) => {
        this.displayedFollowUps = data ?? [];
        this.loading = false;
        // this.toastService.success('Follow-ups retrieved successfully');
      },
      error: (error) => {
        this.loading = false;
        // this.toastService.error(error.message || 'Failed to retrieve follow-ups', 'Follow Ups');
      }
    });
  }

  onFollowUpCreated(): void {
    this.showCreateModal = false;
    this.onRefresh();
  }

  formatDate(value?: string | null): string {
    return formatDate(value);
  }
}
