import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {FarmFollowUp, FarmFollowUpOutcomeRequest} from '../../models/farm-followup.model';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {PageSplitRightAction} from '../../../../shared/components/page-split-layout/page-split-layout/page-split-right-action.model';
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
  showEditButton = false;
  showViewButton = false;
  showActionColumn = false;

  showCreateModal = false;
  showViewModal = false;
  selectedFollowUp: FarmFollowUp | null = null;

  activeSubTab = 'active';
  followUpTabs: TabItem[] = [
    {key: 'active', label: 'Active'},
    {key: 'completed', label: 'Completed'},
  ];

  columns: DataTableColumn<FarmFollowUp>[] = [
    {header: 'Reference', value: (x) => x.referenceNumber},
    {header: 'Remark', value: (x) => x.remark},
    {header: 'Start Date', value: (x) => this.formatDate(x.startDate)},
    {header: 'End Date', value: (x) => this.formatDate(x.endDate)},
  ];

  completedColumns: DataTableColumn<FarmFollowUp>[] = [
    {header: 'Reference', value: (x) => x.referenceNumber},
    {header: 'Remark', value: (x) => x.remark},
    {header: 'Status', value: (x) => x.taskStatus},
    {header: 'Outcome Reason', value: (x) => x.outcomeReason || '-'},
  ];

  followUpRowActions: PageSplitRightAction<FarmFollowUp>[] = [
    {
      id: 'mark-done',
      icon: 'check',
      title: 'Mark Done',
      visible: (f) => f.taskStatus === 'ACTIVE' && this.canActOn(f),
      action: (f) => this.onMarkOutcome(f, 'DONE'),
    },
    {
      id: 'mark-excluded',
      icon: 'ban',
      title: 'Mark Excluded',
      visible: (f) => f.taskStatus === 'ACTIVE' && this.canActOn(f),
      action: (f) => this.onMarkOutcome(f, 'EXCLUDED'),
    },
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
    const isWorker = this.authService.isExtensionWorker();
    this.showCreateButton = isWorker;
    this.showEditButton = isWorker;
    this.showActionColumn = isWorker || this.authService.isAdmin();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.externalId && this.externalId !== this.lastExternalId) {
      this.lastExternalId = this.externalId;
      this.displayedFollowUps = this.followUps ?? [];
    }
  }

  get activeFollowUps(): FarmFollowUp[] {
    return this.displayedFollowUps.filter((f) => f.taskStatus === 'ACTIVE');
  }

  get completedFollowUps(): FarmFollowUp[] {
    return this.displayedFollowUps.filter((f) => f.taskStatus !== 'ACTIVE');
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

  handleOutcomeConfirm(): void {
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

  private formatDate(value?: string | null): string {
    if (!value) return '-';
    const d = new Date(value);
    if (!Number.isFinite(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
}

