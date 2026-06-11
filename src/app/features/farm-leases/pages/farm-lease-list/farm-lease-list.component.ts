import {Component, OnInit} from '@angular/core';
import {jsPDF} from 'jspdf';
import {LeaseAgreement, LeaseFilterRequest} from '../../models/farm-lease.model';
import {
  FundingStatus,
  InvestmentPackage,
  InvestmentPaymentStatus,
  InvestmentRecord,
} from '../../../investment-package/models/investment-package.model';
import {InvestmentPackageService} from '../../../investment-package/services/investment-package.service';
import {UserService} from '../../../users/services/user.service';
import {User} from '../../../users/models/user.model';
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
import {FarmPlot, FarmPlotFilterRequest, FarmPlotSizeType, FarmPlotSoilType, FarmPlotStatus} from "../../../farm-plots/models/farm-plot.model";
import {FarmPlotService} from "../../../farm-plots/services/farm-plot.service";
import {environment} from '../../../../../environments/environment';
import {Router} from '@angular/router';

@Component({
  selector: 'app-farm-lease-list',
  standalone: false,
  templateUrl: './farm-lease-list.component.html',
  styleUrl: './farm-lease-list.component.css',
})
export class FarmLeaseListComponent implements OnInit {
  private readonly storageApiUrl = `${environment.apiUrl}/files`;

  leases: LeaseAgreement[] = [];
  loading = false;
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  currentPage = 0;

  searchText = '';
  status: FundingStatus | '' = '';
  paymentStatus: InvestmentPaymentStatus | '' = '';
  soilType: FarmPlotSoilType | '' = '';

  showCreateModal = false;
  showEditModal = false;
  showEditInvestmentPackageModal = false;
  showDeleteModal = false;
  deleting = false;
  showCreateInvestmentModal = false;
  selectedLease: LeaseAgreement | null = null;
  detailRefreshKey = 0;
  showAdminActionModal = false;

  extensionWorkers: User[] = [];
  selectedExtensionWorkerId: string | null = null;
  loadingExtensionWorkers = false;
  assigningExtensionWorker = false;
  private adminActionLoading = false;
  showContractModal = false;
  contractLoading = false;
  contractHtml = '';
  contractFileName = 'lease-contract.html';

  columns: DataTableColumn<LeaseAgreement>[] = [];

  activeTab = 'detail';

  tabs: TabItem[] = [
    {key: 'detail', label: 'Detail'},
    {key: 'farm-plot', label: 'FarmPlot'},
    {key: 'investor', label: 'Investor'},
    {key: 'extension-worker', label: 'Extension Worker'},
    {key: 'follow-up', label: 'FollowUp'},
  ];

  packageInvestments: InvestmentRecord[] = [];
  packageInvestmentsLoading = false;

  tableRowActions: PageSplitRightAction<LeaseAgreement>[] = [];
  readonly rightActions: PageSplitRightAction<LeaseAgreement>[] = [];
  plot: FarmPlot | null = null;
  investorFarmPlots: FarmPlot[] = [];
  investorPlotsLoading = false;

  investorPlotSearchText = '';
  investorPlotStatus: FarmPlotStatus | '' = '';
  investorPlotSoilType: FarmPlotSoilType | '' = '';
  investorPlotSizeType: FarmPlotSizeType | '' = '';

  readonly getInvestorPlotCardTitle = (plot: FarmPlot): string =>
    plot.title.length > 30 ? `${plot.title.slice(0, 28)}..` : plot.title;
  readonly getInvestorPlotCreatedDate = (plot: FarmPlot): Date | undefined => plot.createdAt;
  readonly getInvestorPlotThumbnailAlt = (plot: FarmPlot): string => `${plot.title} thumbnail`;
  readonly getInvestorPlotThumbnailUrl = (plot: FarmPlot): string | null =>
    plot.imageUuid ? `${this.storageApiUrl}/${plot.imageUuid}` : null;

  myRequest = true;

  constructor(
    private farmLeaseService: FarmLeaseService,
    private investmentPackageService: InvestmentPackageService,
    private userService: UserService,
    private toastService: ToastService,
    private authService: AuthService,
    private farmPlotService: FarmPlotService,
    private router: Router,
  ) {
    this.buildColumns();
    this.buildTableRowActions();
  }

  private buildColumns(): void {
    this.columns = [
      {header: 'Title', value: (l) => l.title},
      {header: 'Farm activity', value: (l) => l.farmActivity},
      {header: 'Water source', value: (l) => l.waterSource},
      {header: 'Target', value: (l) => this.formatAmount(l.targetAmount)},
      {header: 'Status', value: (l) => l.fundingStatus},
    ];
  }

  private buildTableRowActions(): void {
    if (this.isAdmin) {
      this.tableRowActions = [
        {
          id: 'review',
          icon: 'check',
          title: 'Review',
          visible: (l) => this.canAdminReview(l),
          action: (l) => this.onApproveLease(l),
        },
      ];
      return;
    }

    if (this.isInvestorUser) {
      this.tableRowActions = [
        {
          id: 'invest',
          icon: 'plus',
          title: 'Invest',
          visible: (r) => r.fundingStatus === 'OPEN',
          action: (r) => this.onInvest(r),
        },
        {
          id: 'download',
          icon: 'download',
          title: 'Download',
          visible: (r) =>
            !!r.agreementId &&
            (r.fundingStatus === 'FUNDED' || r.fundingStatus === 'ACTIVE'),
          action: (r) => this.onDownload(r),
        },
      ];
      return;
    }

    this.tableRowActions = [];
  }

  hasAppliedInvestors(lease: LeaseAgreement): boolean {
    return (lease.investorIdList?.length ?? 0) > 0;
  }

  getAdminActionCellLabel(lease: LeaseAgreement): string {
    if (!this.hasAppliedInvestors(lease)) {
      return 'No investor';
    }
    return '';
  }

  canAdminReview(lease: LeaseAgreement): boolean {
    return this.hasAppliedInvestors(lease)
      && (lease.fundingStatus === 'PENDING' || lease.fundingStatus === 'OPEN');
  }

  get canAssignExtensionWorker(): boolean {
    if (!this.selectedLease) {
      return false;
    }
    return (
      this.authService.isAdmin() &&
      this.selectedLease.fundingStatus === 'OPEN' &&
      !this.selectedLease.extensionWorker
    );
  }

  public shouldShowLeaseEditButton(_lease: LeaseAgreement | null | undefined): boolean {
    return false;
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
    if (tab === 'extension-worker' && this.extensionWorkers.length === 0 && !this.loadingExtensionWorkers) {
      this.loadExtensionWorkers();
    }
    if (tab === 'investor' && this.selectedLease?.id) {
      this.loadPackageInvestments(this.selectedLease.id);
    }
  }

  loadPackageInvestments(packageId: string): void {
    this.packageInvestmentsLoading = true;
    this.investmentPackageService.filterInvestments({
      crowdFundingIds: [packageId],
      sortBy: 'createdDate',
      sortDirection: 'DESC',
      page: 0,
      size: 100,
    }).subscribe({
      next: (response) => {
        this.packageInvestments = (response.content ?? []).filter(
          (investment) => investment.crowdFundingId === packageId,
        );
        this.packageInvestmentsLoading = false;
      },
      error: (error) => {
        this.packageInvestments = [];
        this.packageInvestmentsLoading = false;
        this.toastService.error(
          error.message || 'Failed to load package investors',
          'Load Investors',
        );
      },
    });
  }

  asInvestmentPackage(lease: LeaseAgreement | null): InvestmentPackage | null {
    if (!lease) {
      return null;
    }
    return {
      ...lease,
      farmPlotId: lease.farmPlotId ?? lease.farmPlot?.id ?? '',
      followUpDtoList: lease.followUpDtoList ?? [],
    } as InvestmentPackage;
  }

  ngOnInit(): void {
    if (this.isInvestorUser) {
      this.status = '';
      this.loadInvestorPlots();
    }
    this.buildTableRowActions();
    this.loadLeases();
  }

  public get isInvestorUser(): boolean {
    return this.authService.isInvestor();
  }

  public get isExtensionWorkerUser(): boolean {
    return this.authService.isExtensionWorker();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  private shouldApplyInvestorLeaseVisibility(): boolean {
    return this.isInvestorUser && !this.isAdmin;
  }

  private isLeaseVisibleToInvestor(lease: LeaseAgreement): boolean {
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) return false;
    if (lease.fundingStatus === 'OPEN') return true;
    return lease.investorIdList?.includes(userId) ?? false;
  }

  private filterLeasesForInvestor(leases: LeaseAgreement[]): LeaseAgreement[] {
    return leases.filter((l) => this.isLeaseVisibleToInvestor(l));
  }

  private buildFilterRequest(): LeaseFilterRequest {
    return {
      searchText: this.searchText || undefined,
      statuses: !this.shouldApplyInvestorLeaseVisibility() && this.status ? [this.status] : undefined,
      paymentStatuses: this.paymentStatus ? [this.paymentStatus] : undefined,
      soilTypes: this.soilType ? [this.soilType] : undefined,
      sortBy: 'fundingDeadline',
      sortDirection: 'DESC',
      page: this.currentPage,
      size: this.pageSize,
    };
  }

  private getLeaseAgreementId(lease: LeaseAgreement | null | undefined): string | null {
    if (!lease) {
      return null;
    }
    return lease.agreementId ?? lease.id ?? null;
  }

  loadLeases(): void {
    this.loading = true;
    const request = this.buildFilterRequest();
    this.farmLeaseService.filterLeases(request).subscribe({
      next: (response: PageResponse<LeaseAgreement>) => {
        const content = this.shouldApplyInvestorLeaseVisibility()
          ? this.filterLeasesForInvestor(response.content)
          : response.content;
        this.leases = content;
        this.total = this.shouldApplyInvestorLeaseVisibility() ? content.length : response.totalElements;
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
          this.refreshPackageInvestmentsIfNeeded();
          return;
        }

        this.selectedLease = {...this.leases[0]};
        this.detailRefreshKey++;
        this.refreshPackageInvestmentsIfNeeded();
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
    this.paymentStatus = '';
    this.soilType = '';
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadLeases();
  }

  onView(lease: LeaseAgreement): void {
    if (this.isInvestorUser && window.innerWidth < 1020) {
      void this.router.navigate(['/farm-leases/lease', lease.id]);
      return;
    }
    this.selectedLease = {...lease};
    this.plot = null;
    this.packageInvestments = [];
    this.showCreateModal = false;
    this.showEditModal = false;
    if (this.activeTab === 'investor') {
      this.loadPackageInvestments(lease.id);
    }
  }

  private refreshPackageInvestmentsIfNeeded(): void {
    if (this.activeTab === 'investor' && this.selectedLease?.id) {
      this.loadPackageInvestments(this.selectedLease.id);
    }
  }

  onEdit(lease: LeaseAgreement): void {
    this.selectedLease = {...lease};
    this.showCreateModal = false;
    this.showEditModal = true;
  }

  onEditPackage(lease: LeaseAgreement): void {
    this.selectedLease = {...lease};
    this.showDeleteModal = false;
    this.showEditInvestmentPackageModal = true;
  }

  onDeletePackage(lease: LeaseAgreement): void {
    this.selectedLease = {...lease};
    this.showEditInvestmentPackageModal = false;
    this.showDeleteModal = true;
  }

  handleDeleteConfirmation(): void {
    if (!this.selectedLease?.id) return;

    this.deleting = true;
    this.investmentPackageService.deleteInvestmentPackage(this.selectedLease.id).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteModal = false;
        this.selectedLease = null;
        this.toastService.success('Investment package deleted successfully');
        this.loadLeases();
      },
      error: (error) => {
        this.deleting = false;
        this.toastService.error(
          error.message || 'Failed to delete investment package',
          'Delete Investment Package',
        );
      },
    });
  }

  onInvestmentPackageUpdated(): void {
    this.showEditInvestmentPackageModal = false;
    this.detailRefreshKey++;
    this.loadLeases();
  }

  onApproveLease(lease: LeaseAgreement): void {
    // Open admin action modal (Approve/Reject).
    this.selectedLease = {...lease};
    this.showEditModal = false;
    this.showCreateModal = false;
    this.showAdminActionModal = true;
  }

  onAdminDecision(decision: AdminLeaseDecision): void {
    const leaseId = this.getLeaseAgreementId(this.selectedLease);
    if (!leaseId) return;

    if (this.adminActionLoading) return;
    this.adminActionLoading = true;

    this.farmLeaseService.adminDecideLease(leaseId, decision).subscribe({
      next: (res: ApiResponse<LeaseAgreement>) => {
        this.adminActionLoading = false;
        this.toastService.success(
          decision === 'ACCEPTED' ? 'Lease activated successfully' : 'Lease rejected successfully',
          'Admin Lease Action',
        );
        this.detailRefreshKey++;
        this.selectedLease = res?.data ?? null;
        this.loadLeases();
      },
      error: () => {
        this.adminActionLoading = false;
      },
    });
  }

  onInvest(lease: LeaseAgreement): void {
    this.selectedLease = {...lease};
    this.showCreateInvestmentModal = true;
  }

  onInvestmentCreated(): void {
    this.showCreateInvestmentModal = false;
    this.toastService.success('Investment registered successfully');
    this.loadLeases();
  }

  loadExtensionWorkers(): void {
    this.loadingExtensionWorkers = true;
    this.userService.getUsersByRole('EXTENSION_WORKER').subscribe({
      next: (users) => {
        this.extensionWorkers = users ?? [];
        this.loadingExtensionWorkers = false;
      },
      error: () => {
        this.extensionWorkers = [];
        this.loadingExtensionWorkers = false;
        this.toastService.error('Failed to load extension workers', 'Extension Worker');
      },
    });
  }

  assignExtensionWorker(): void {
    if (!this.selectedLease?.id || !this.selectedExtensionWorkerId) {
      return;
    }

    this.assigningExtensionWorker = true;
    this.investmentPackageService.assignExtensionWorker({
      externalId: this.selectedLease.id,
      extensionWorkerId: this.selectedExtensionWorkerId,
    }).subscribe({
      next: (res: ApiResponse<InvestmentPackage>) => {
        this.assigningExtensionWorker = false;
        this.selectedLease = (res?.data as LeaseAgreement | undefined) ?? null;
        this.selectedExtensionWorkerId = null;
        this.detailRefreshKey++;
        this.toastService.success('Extension Worker assigned successfully');
        this.loadLeases();
      },
      error: () => {
        this.assigningExtensionWorker = false;
        this.toastService.error('Failed to assign Extension Worker');
      },
    });
  }

  formatWorkerName(worker: User | null | undefined): string {
    if (!worker) {
      return '-';
    }
    const name = [worker.firstName, worker.lastName].filter(Boolean).join(' ').trim();
    return name || worker.username || worker.email || '-';
  }

  getExtensionWorkerDisplayName(user: User): string {
    return this.formatWorkerName(user);
  }

  onLeaseCreated(): void {
    this.showCreateModal = false;
    this.plot = null;
    this.detailRefreshKey++;
    this.loadLeases();
    this.loadInvestorPlots();
  }

  onLeaseUpdated(): void {
    this.showEditModal = false;
    this.detailRefreshKey++;
    this.loadLeases();
  }

  private loadInvestorPlots(): void {
    if (!this.authService.isInvestor()) return;

    this.investorPlotsLoading = true;
    const filterRequest: FarmPlotFilterRequest = {
      searchText: this.investorPlotSearchText || undefined,
      statuses: ['ACTIVE'],
      soilTypes: this.investorPlotSoilType ? [this.investorPlotSoilType] : undefined,
      sizeTypes: this.investorPlotSizeType ? [this.investorPlotSizeType] : undefined,
      sortBy: 'title',
      sortDirection: 'ASC',
      page: 0,
      size: 1000000000,
    };

    this.farmPlotService.filterFarmPlots(filterRequest).subscribe({
      next: (response) => {
        this.investorFarmPlots = response.content;
        this.investorPlotsLoading = false;
      },
      error: (error) => {
        this.investorPlotsLoading = false;
        this.toastService.error(error.message || 'Failed to fetch farm plots', 'Load Farm Plots');
      },
    });
  }

  public onInvestorPlotSearch(): void {
    // Called from the filter bar apply/enter actions.
    this.loadInvestorPlots();
  }

  public onInvestorPlotClearFilters(): void {
    this.investorPlotSearchText = '';
    this.investorPlotStatus = '';
    this.investorPlotSoilType = '';
    this.investorPlotSizeType = '';
    this.loadInvestorPlots();
  }

  public plotStatusPillClass(status: FarmPlot['status']): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'INACTIVE':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'UNDER_MAINTENANCE':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'ASSIGNED_TO_LEASE':
      case 'ASSIGNED_TO_INVESTMENT_PACKAGE':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  public onViewPlot(plot: FarmPlot, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (window.innerWidth < 1080) {
      void this.router.navigate(['/farm-leases/plot', plot.id]);
      return;
    }

    this.plot = {...plot};
  }

  public onChoosePlot(plot: FarmPlot): void {
    this.plot = {...plot};
    this.selectedLease = null;
    this.showCreateModal = true;
  }

  public openCreateLeaseFromPreview(): void {
    if (!this.plot) return;
    this.selectedLease = null;
    this.showCreateModal = true;
  }

  formatAmount(value: number | undefined): string {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(
      value,
    );
  }

  private onDownload(r: LeaseAgreement) {
    const leaseId = this.getLeaseAgreementId(r);
    if (!leaseId) {
      return;
    }

    this.contractLoading = true;
    this.contractHtml = '';
    this.contractFileName = `lease-contract-${leaseId}.pdf`;
    this.farmLeaseService.getContractHtml(leaseId).subscribe({
      next: (html) => {
        this.contractHtml = html;
        this.showContractModal = true;
        this.contractLoading = false;
      },
      error: (error) => {
        this.contractLoading = false;
        this.toastService.error(
          error.message || 'Failed to load contract document',
          'Lease Contract'
        );
      }
    });
  }

  async onDownloadContractFile(): Promise<void> {
    if (!this.contractHtml) {
      this.toastService.error('No contract content available to download', 'Lease Contract');
      return;
    }

    this.contractLoading = true;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = '1024px';
    iframe.style.height = '1400px';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    try {
      await new Promise<void>((resolve, reject) => {
        iframe.onload = () => resolve();
        iframe.onerror = () => reject(new Error('Failed to load contract frame'));
        iframe.srcdoc = this.contractHtml;
      });

      const contentBody = iframe.contentDocument?.body;
      if (!contentBody) {
        throw new Error('Unable to access contract content');
      }

      const pdf = new jsPDF('p', 'pt', 'a4');
      await pdf.html(contentBody, {
        margin: [20, 20, 20, 20],
        autoPaging: 'text',
        html2canvas: {
          scale: 0.7,
          useCORS: true,
          logging: false,
        },
      });
      pdf.save(this.contractFileName);
    } catch (error) {
      this.toastService.error('Failed to generate PDF contract', 'Lease Contract');
    } finally {
      this.contractLoading = false;
      iframe.remove();
    }
  }

}
