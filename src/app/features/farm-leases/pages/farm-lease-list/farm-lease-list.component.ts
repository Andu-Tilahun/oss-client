import {Component, OnInit} from '@angular/core';
import {LeaseAgreement, LeaseFilterRequest, LeaseStatus} from '../../models/farm-lease.model';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {FarmLeaseService} from '../../services/farm-lease.service';
import {ApiResponse, PageResponse} from '../../../../shared/models/api-response.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {TableQueryParams} from '../../../../shared/data-table/models/table-query-params.model';
import {
  PageSplitRightAction
} from '../../../../shared/components/page-split-layout/page-split-layout/page-split-right-action.model';
import {AuthService} from '../../../auth/services/auth.service';
import {AdminLeaseDecision} from '../../modals/farm-lease-approve-modal/farm-lease-approve-modal.component';
import {TabItem} from "../../../../shared/tabs/models/tab-item.model";
import {AssignExtensionWorkerRequest} from "../../../assign-extension-worker-request";

@Component({
  selector: 'app-farm-lease-list',
  standalone: false,
  templateUrl: './farm-lease-list.component.html',
  styleUrl: './farm-lease-list.component.css',
})
export class FarmLeaseListComponent implements OnInit {
  leases: LeaseAgreement[] = [];
  loading = false;
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  currentPage = 0;

  searchText = '';
  status: LeaseStatus | '' = '';

  showCreateModal = false;
  showEditModal = false;
  selectedLease: LeaseAgreement | null = null;
  detailRefreshKey = 0;
  assignExtensionWorkerRequest = {} as AssignExtensionWorkerRequest;
  showAdminActionModal = false;
  showAssignExtenstionWorkerModal = false;
  lockSend = false;
  lockCancel = false;
  showConfirmationModal = false;
  showCancelModal = false;
  private adminActionLoading = false;

  columns: DataTableColumn<LeaseAgreement>[] = [
    {header: 'Start', value: (l) => l.startDate},
    {header: 'End', value: (l) => l.endDate},
    {header: 'Duration (mo)', value: (l) => String(l.totalDurationMonths)},
    {header: 'Status', value: (l) => l.status},
    {header: 'Amount', value: (l) => this.formatAmount(l.totalAmount)},
  ];

  activeTab = 'detail';

  tabs: TabItem[] = [
    {key: 'detail', label: 'Detail'},
    {key: 'farm-plot', label: 'FarmPlot'},
    {key: 'user', label: 'User'},
    {key: 'follow-up', label: 'FollowUp'},
  ];

  rightActions: PageSplitRightAction<LeaseAgreement>[];

  constructor(
    private farmLeaseService: FarmLeaseService,
    private toastService: ToastService,
    private authService: AuthService,
  ) {
    const role = (this.authService.getCurrentUser()?.role ?? '').toString().trim().toUpperCase();

    this.rightActions = [
      {
        id: 'sent',
        icon: 'send',
        title: 'Send',
        visible: (r) => this.authService.isInvestor() && r.status == "PENDING",
        action: (r) => this.onSend(r),
      },
      {
        id: 'cancel',
        icon: 'cancel',
        title: 'Cancel',
        visible: (r) => this.authService.isInvestor() && r.status == "PENDING",
        action: (r) => this.onCancel(r),
      },

      {
        id: 'download',
        icon: 'download',
        title: 'Download',
        visible: (r) => this.authService.isInvestor() && r.status == "ACCEPTED",
        action: (r) => this.onDownload(r),
      },
      {
        id: 'approve',
        icon: 'check',
        title: 'Approve lease',
        visible: (l) => this.authService.isAdmin() && l.status == "SENT",
        action: (l) => this.onApproveLease(l),
      },
      {
        id: 'assign',
        icon: 'assign',
        title: 'Assign Extension Worker',
        visible: (r) => this.authService.isInvestor() && r.status == "ACCEPTED" && !r.extensionWorker,
        action: (r) => this.onAssignExtensionWorker(r),
      },
    ];
  }

  private normalizeStatus(status: unknown): string {
    return (status ?? '').toString().trim().toUpperCase();
  }

  private isLeaseActive(lease: LeaseAgreement | null | undefined): boolean {
    return this.normalizeStatus(lease?.status) === 'ACTIVE';
  }

  private isLeasePending(lease: LeaseAgreement | null | undefined): boolean {
    return this.normalizeStatus(lease?.status) === 'PENDING';
  }

  public shouldShowLeaseEditButton(lease: LeaseAgreement | null | undefined): boolean {
    return this.authService.isInvestor() && lease?.status == 'PENDING';
  }

  private shouldShowApproveLeaseAction(lease: LeaseAgreement | null | undefined): boolean {
    if (!lease) return false;
    // Admin approves/rejects leases that are registered but not yet active.
    return this.authService.isAdmin() && this.isLeasePending(lease);
  }

  ngOnInit(): void {
    // Admin should start on "needs decision" leases.
    if (this.authService.isAdmin() && !this.status) {
      this.status = 'PENDING';
    }
    this.loadLeases();
  }

  public get isInvestorUser(): boolean {
    return this.authService.isInvestor();
  }

  private buildFilterRequest(): LeaseFilterRequest {
    return {
      searchText: this.searchText || undefined,
      statuses: this.status ? [this.status] : undefined,
      sortBy: 'startDate',
      sortDirection: 'DESC',
      page: this.currentPage,
      size: this.pageSize,
    };
  }

  loadLeases(): void {
    this.loading = true;
    const request = this.buildFilterRequest();
    this.farmLeaseService.filterLeases(request).subscribe({
      next: (response: PageResponse<LeaseAgreement>) => {
        this.leases = response.content;
        this.total = response.totalElements;
        this.loading = false;
        this.toastService.success('Leases retrieved successfully');

        const previousSelectedId = this.selectedLease?.id;

        if (this.leases.length === 0) {
          this.selectedLease = null;
          return;
        }

        if (!previousSelectedId) {
          this.selectedLease = {...this.leases[0]};
          this.detailRefreshKey++;
          return;
        }

        const match = this.leases.find((l) => l.id === previousSelectedId);
        if (match) {
          this.selectedLease = {...match};
          return;
        }

        this.selectedLease = {...this.leases[0]};
        this.detailRefreshKey++;
      },
      error: (error) => {
        this.toastService.error(error.message || 'Failed to fetch leases', 'Fetch Leases');
        this.loading = false;
      },
    });
  }

  onPageChange(params: TableQueryParams) {
    this.pageIndex = params.pageIndex;
    this.currentPage = this.pageIndex - 1;
    this.pageSize = params.pageSize;
    this.loadLeases();
  }

  onAdd(): void {
    this.showCreateModal = true;
  }

  onRefresh(): void {
    this.loadLeases();
  }

  onSearch(): void {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadLeases();
  }

  onFilterChange(): void {
    this.onSearch();
  }

  clearFilters(): void {
    this.searchText = '';
    this.status = '';
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadLeases();
  }

  onView(lease: LeaseAgreement): void {
    this.selectedLease = {...lease};
    this.showCreateModal = false;
    this.showEditModal = false;
  }

  onEdit(lease: LeaseAgreement): void {
    this.selectedLease = {...lease};
    this.showCreateModal = false;
    this.showEditModal = true;
  }

  onApproveLease(lease: LeaseAgreement): void {
    // Open admin action modal (Approve/Reject).
    this.selectedLease = {...lease};
    this.showEditModal = false;
    this.showCreateModal = false;
    this.showAdminActionModal = true;
  }

  onAdminDecision(decision: AdminLeaseDecision): void {
    const leaseId = this.selectedLease?.id;
    if (!leaseId) return;

    if (this.adminActionLoading) return;
    this.adminActionLoading = true;

    const request$ = this.farmLeaseService.adminDecideLease(leaseId, decision);

    request$.subscribe({
      next: (res: ApiResponse<LeaseAgreement>) => {
        this.adminActionLoading = false;
        this.toastService.success(
          decision === 'ACCEPTED' ? 'Lease activated successfully' : 'Lease rejected successfully',
          'Admin Lease Action',
        );
        this.detailRefreshKey++;
        this.selectedLease = res?.data ?? null;
      },
      error: () => {
        this.adminActionLoading = false;
      },
    });
  }

  onLeaseCreated(): void {
    this.showCreateModal = false;
    this.detailRefreshKey++;
    this.loadLeases();
  }

  onLeaseUpdated(): void {
    this.showEditModal = false;
    this.detailRefreshKey++;
    this.loadLeases();
  }

  private formatAmount(value: number | undefined): string {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(
      value,
    );
  }

  private onAssignExtensionWorker(r: LeaseAgreement) {
    this.showAssignExtenstionWorkerModal = true;
  }

  onSelectedUser(id: any) {
    this.assignExtensionWorkerRequest.externalId = this.selectedLease!.id;
    this.assignExtensionWorkerRequest.extensionWorkerId = id;
    console.log(this.assignExtensionWorkerRequest)
  }

  onConfirm($event: void) {
    this.farmLeaseService.assignExtensionWorker(this.assignExtensionWorkerRequest).subscribe({
      next: (res: ApiResponse<LeaseAgreement>) => {
        this.selectedLease = res?.data ?? null;
        this.loading = false;
        this.toastService.success('Extension Worker Assigned successfully');
      },
      error: () => {
        this.toastService.error('Failed to assign Extension Worker');
        this.loading = false;
      },
    });
  }

  onSend(leaseAgreement: LeaseAgreement): void {
    this.selectedLease = {...leaseAgreement};
    this.showConfirmationModal = true;
    this.lockSend = false;
  }

  onCancel(leaseAgreement: LeaseAgreement): void {
    this.selectedLease = {...leaseAgreement};
    this.showCancelModal = true;
    this.lockCancel = false;
  }


  private onDownload(r: LeaseAgreement) {
    return undefined;
  }

  handleSendConfirmation() {
    if (!this.selectedLease) return;

    this.lockSend = true;

    this.farmLeaseService.send(this.selectedLease.id).subscribe({
      next: (res: ApiResponse<LeaseAgreement>) => {
        this.selectedLease = res?.data ?? null;
        this.lockSend = false;
        this.showConfirmationModal = false;
        this.toastService.success(`Lease Agreement sent successfully`);

      },
      error: (error) => {
        this.lockSend = false;
        this.toastService.error(
          error.message || 'Failed to send Lease Agreement',
          'Send Agreement'
        );
      }
    });

  }

  handleCancelConfirmation() {
    if (!this.selectedLease) return;

    this.lockCancel = true;

    this.farmLeaseService.cancel(this.selectedLease.id).subscribe({
      next: (res: ApiResponse<LeaseAgreement>) => {
        this.selectedLease = res?.data ?? null;
        this.lockCancel = false;
        this.showConfirmationModal = false;
        this.toastService.success(`Lease Agreement cancelled successfully`);

      },
      error: (error) => {
        this.lockCancel = false;
        this.toastService.error(
          error.message || 'Failed to cancel Lease Agreement',
          'Cancel Agreement'
        );
      }
    });
  }
}
