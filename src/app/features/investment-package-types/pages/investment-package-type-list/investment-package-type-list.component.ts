import {Component, DestroyRef, OnInit} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {jsPDF} from 'jspdf';
import {InvestmentPackageTypeAgreement, InvestmentPackageTypeFilterRequest} from '../../models/investment-package-type.model';
import {ActivatedRoute, Router} from '@angular/router';
import {
  InvestmentPackage,
  InvestmentPackageType,
  InvestmentPaymentStatus,
  InvestmentRecord,
} from '../../../investment-package/models/investment-package.model';
import {FundingStatus} from '../../../../shared/models/funding-status.model';
import {InvestmentPackageService} from '../../../investment-package/services/investment-package.service';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {InvestmentPackageTypeService} from '../../services/investment-package-type.service';
import {ApiResponse, PageResponse} from '../../../../shared/models/api-response.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {TableQueryParams} from '../../../../shared/data-table/models/table-query-params.model';
import {
  PageSplitRightAction
} from '../../../../shared/components/page-split-layout/page-split-layout/page-split-right-action.model';
import {AuthService} from '../../../auth/services/auth.service';
import {AdminInvestmentPackageTypeDecision} from '../../modals/investment-package-type-admin-action-modal/investment-package-type-admin-action-modal.component';
import {TabItem} from "../../../../shared/tabs/models/tab-item.model";
import {FarmPlot, FarmPlotFilterRequest, FarmPlotSizeType, FarmPlotSoilType, FarmPlotStatus} from "../../../farm-plots/models/farm-plot.model";
import {FarmPlotService} from "../../../farm-plots/services/farm-plot.service";
import {environment} from '../../../../../environments/environment';

@Component({
  selector: 'app-investment-package-type-list',
  standalone: false,
  templateUrl: './investment-package-type-list.component.html',
  styleUrl: './investment-package-type-list.component.css',
})
export class InvestmentPackageTypeListComponent implements OnInit {
  private readonly storageApiUrl = `${environment.apiUrl}/files`;

  packageTypes: InvestmentPackageTypeAgreement[] = [];
  loading = false;
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  currentPage = 0;

  searchText = '';
  fundingStatus: FundingStatus | '' = '';
  paymentStatus: InvestmentPaymentStatus | '' = '';
  soilType: FarmPlotSoilType | '' = '';

  showCreateModal = false;
  showEditModal = false;
  showEditInvestmentPackageModal = false;
  showDeleteModal = false;
  deleting = false;
  showCreateInvestmentModal = false;
  selectedAgreement: InvestmentPackageTypeAgreement | null = null;
  detailRefreshKey = 0;
  pendingForcedTab: string | null = null;
  showAdminActionModal = false;

  private adminActionLoading = false;
  showContractModal = false;
  contractLoading = false;
  contractHtml = '';
  contractFileName = 'lease-contract.html';

  columns: DataTableColumn<InvestmentPackageTypeAgreement>[] = [];

  activeTab = 'detail';

  get tabs(): TabItem[] {
    const tabs: TabItem[] = [
      {key: 'detail', label: 'Detail'},
      {key: 'farm-plot', label: 'FarmPlot'},
      {key: 'investor', label: 'Investor'},
      {key: 'extension-worker', label: 'Extension Worker'},
      {key: 'follow-up', label: 'FollowUp'},
    ];
    if (this.isAdmin) {
      if (this.investmentPackageType === 'LEASING') {
        tabs.splice(3, 0, {key: 'contract', label: 'Contract'});
      } else {
        tabs.splice(3, 0, {key: 'choose-candidate', label: 'Choose Candidate'});
      }
    } else if (
      this.isInvestorUser &&
      this.investmentPackageType === 'LEASING' &&
      this.selectedAgreement?.paymentStatus === 'PAID'
    ) {
      tabs.splice(3, 0, {key: 'contract', label: 'Contract'});
    }
    return tabs;
  }

  packageInvestments: InvestmentRecord[] = [];
  packageInvestmentsLoading = false;

  tableRowActions: PageSplitRightAction<InvestmentPackageTypeAgreement>[] = [];
  readonly rightActions: PageSplitRightAction<InvestmentPackageTypeAgreement>[] = [];
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

  investmentPackageType: InvestmentPackageType = 'LEASING';
  pageTitle = 'Leasing Investment Packages';

  private appliedPackageType: InvestmentPackageType | null = null;

  constructor(
    private investmentPackageTypeService: InvestmentPackageTypeService,
    private investmentPackageService: InvestmentPackageService,
    private toastService: ToastService,
    private authService: AuthService,
    private farmPlotService: FarmPlotService,
    private router: Router,
    private route: ActivatedRoute,
    private destroyRef: DestroyRef,
  ) {
    const data = this.route.snapshot.data;
    this.investmentPackageType = data['investmentPackageType'] ?? 'LEASING';
    this.pageTitle = data['pageTitle'] ?? 'Leasing Investment Packages';
    this.buildColumns();
    this.buildTableRowActions();
  }

  get routeSegment(): string {
    return this.investmentPackageType.toLowerCase();
  }

  private buildColumns(): void {
    this.columns = [
      {header: 'Title', value: (l) => l.title},
      {header: 'Farm activity', value: (l) => l.farmActivity},
      {header: 'Water source', value: (l) => l.waterSource},
      {header: 'Target', value: (l) => this.formatAmount(l.targetAmount)},
      {header: 'Funding Status', value: (l) => l.fundingStatus},
    ];
  }

  private buildTableRowActions(): void {
    if (this.isAdmin) {
      this.tableRowActions = [
        {
          id: 'edit',
          icon: 'edit',
          title: 'Edit',
          visible: (l) => l.fundingStatus !== FundingStatus.CLOSED,
          action: (l) => this.onEditPackage(l),
        },
        {
          id: 'delete',
          icon: 'delete',
          title: 'Delete',
          visible: (l) => l.fundingStatus !== FundingStatus.CLOSED,
          action: (l) => this.onDeletePackage(l),
        },
        {
          id: 'review',
          icon: 'check',
          title: 'Review',
          visible: (l) => this.canAdminReview(l),
          action: (l) => this.onApprovePackageType(l),
        },
        {
          id: 'choose-candidate',
          icon: 'assign',
          title: 'Choose Candidate',
          visible: (l) => this.investmentPackageType !== 'LEASING' && l.fundingStatus === FundingStatus.CLOSED,
          action: (l) => this.onChooseCandidateAction(l),
        },
        {
          id: 'contract',
          icon: 'assign',
          title: 'Create Contract',
          visible: (l) => this.investmentPackageType === 'LEASING' && l.fundingStatus === FundingStatus.CLOSED,
          action: (l) => this.onContractAction(l),
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
          visible: (r) => r.fundingStatus === FundingStatus.OPEN,
          action: (r) => this.onInvest(r),
        },
        {
          id: 'download',
          icon: 'download',
          title: 'Download',
          visible: (r) =>
            !!r.agreementId &&
            r.fundingStatus === FundingStatus.FUNDED,
          action: (r) => this.onDownload(r),
        },
      ];
      return;
    }

    this.tableRowActions = [];
  }

  hasAppliedInvestors(lease: InvestmentPackageTypeAgreement): boolean {
    return (lease.investorIdList?.length ?? 0) > 0;
  }

  readonly getAdminActionCellLabel = (lease: InvestmentPackageTypeAgreement): string => {
    if (!this.hasAppliedInvestors(lease)) {
      return 'No investor';
    }
    return '';
  };

  canAdminReview(lease: InvestmentPackageTypeAgreement): boolean {
    return this.hasAppliedInvestors(lease)
      && lease.fundingStatus === FundingStatus.OPEN;
  }

  public shouldShowPackageTypeEditButton(_lease: InvestmentPackageTypeAgreement | null | undefined): boolean {
    return false;
  }

  get rightPanelItem(): InvestmentPackageTypeAgreement | FarmPlot | null {
    return this.selectedAgreement ?? this.plot;
  }

  get rightPanelTitle(): string {
    const packageDetailTitle = this.getPackageDetailTitle();
    if (this.selectedAgreement) return packageDetailTitle;
    if (this.isInvestorUser && this.plot) return 'Farm Plot Detail';
    return packageDetailTitle;
  }

  private getPackageDetailTitle(): string {
    switch (this.investmentPackageType) {
      case 'LEASING':
        return 'Leasing Investment Package Detail';
      case 'BIDDING':
        return 'Bidding Investment Package Detail';
      case 'CROWDFUNDING':
        return 'Crowdfunding Detail';
      default:
        return 'Leasing Investment Package Detail';
    }
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
    if (tab === 'investor' && this.selectedAgreement?.id) {
      this.loadPackageInvestments(this.selectedAgreement.id);
    }
  }

  onExtensionWorkerAssigned(pkg: InvestmentPackage): void {
    this.selectedAgreement = pkg as InvestmentPackageTypeAgreement;
    this.detailRefreshKey++;
    this.loadPackageTypes();
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
          (investment) => investment.investmentPackageId === packageId,
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

  asInvestmentPackage(lease: InvestmentPackageTypeAgreement | null): InvestmentPackage | null {
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
      this.loadInvestorPlots();
    }

    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      this.applyRouteData(data);
    });
  }

  private applyRouteData(data: Record<string, unknown>): void {
    const nextType = (data['investmentPackageType'] as InvestmentPackageType) ?? 'LEASING';
    const nextTitle = (data['pageTitle'] as string) ?? 'Leasing Investment Packages';
    const typeChanged = this.appliedPackageType !== null && this.appliedPackageType !== nextType;

    this.appliedPackageType = nextType;
    this.investmentPackageType = nextType;
    this.pageTitle = nextTitle;

    if (typeChanged) {
      this.resetListStateForPackageTypeChange();
    }

    this.buildTableRowActions();
    this.loadPackageTypes();
  }

  private resetListStateForPackageTypeChange(): void {
    this.selectedAgreement = null;
    this.plot = null;
    this.packageInvestments = [];
    this.searchText = '';
    this.fundingStatus = '';
    this.paymentStatus = '';
    this.soilType = '';
    this.currentPage = 0;
    this.pageIndex = 1;

    if (this.isInvestorUser) {
      this.loadInvestorPlots();
    }
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

  get isStaffUser(): boolean {
    return this.isAdmin || this.isExtensionWorkerUser;
  }

  private resolveStatusFilter(): FundingStatus[] | undefined {
    return this.fundingStatus ? [this.fundingStatus] : undefined;
  }

  private resolvePaymentStatusFilter(): InvestmentPaymentStatus[] | undefined {
    return this.paymentStatus ? [this.paymentStatus] : undefined;
  }

  private buildFilterRequest(): InvestmentPackageTypeFilterRequest {
    return {
      searchText: this.searchText.trim() || undefined,
      statuses: this.resolveStatusFilter(),
      paymentStatuses: this.resolvePaymentStatusFilter(),
      soilTypes: this.soilType ? [this.soilType] : undefined,
      investmentPackageType: this.investmentPackageType,
      sortBy: 'fundingDeadline',
      sortDirection: 'DESC',
      page: this.currentPage,
      size: this.pageSize,
    };
  }

  private getPackageTypeAgreementId(agreement: InvestmentPackageTypeAgreement | null | undefined): string | null {
    if (!agreement) {
      return null;
    }
    return agreement.agreementId ?? agreement.id ?? null;
  }

  private syncSelectedAgreementAfterLoad(previousId?: string | null): void {
    if (this.packageTypes.length === 0) {
      this.selectedAgreement = null;
      return;
    }

    if (previousId) {
      const match = this.packageTypes.find((l) => l.id === previousId);
      if (match) {
        this.selectedAgreement = {...match};
        this.refreshPackageInvestmentsIfNeeded();
        return;
      }
    }

    this.selectedAgreement = {...this.packageTypes[0]};
    this.detailRefreshKey++;
    this.refreshPackageInvestmentsIfNeeded();
  }

  /**
   * A CLOSED leasing package is private to admin plus whichever investor/extension-worker
   * is actually involved with it; other investors/extension-workers shouldn't see it at all.
   */
  private filterVisiblePackageTypes(items: InvestmentPackageTypeAgreement[]): InvestmentPackageTypeAgreement[] {
    if (this.isAdmin || this.investmentPackageType !== 'LEASING') {
      return items;
    }

    const currentUserId = this.authService.getCurrentUser()?.id;
    return items.filter((item) => {
      if (item.fundingStatus !== FundingStatus.CLOSED) {
        return true;
      }
      if (this.isInvestorUser) {
        return !!currentUserId && (item.investorId === currentUserId || item.investorIdList?.includes(currentUserId));
      }
      if (this.isExtensionWorkerUser) {
        return !!currentUserId && item.extensionWorker?.id === currentUserId;
      }
      return false;
    });
  }

  loadPackageTypes(): void {
    this.loading = true;
    const request = this.buildFilterRequest();
    this.investmentPackageTypeService.filter(request).subscribe({
      next: (response: PageResponse<InvestmentPackageTypeAgreement>) => {
        const rawContent = response.content ?? [];
        const previousSelectedId = this.selectedAgreement?.id;

        this.packageTypes = this.filterVisiblePackageTypes(rawContent);
        this.total = response.totalElements ?? rawContent.length;
        this.loading = false;
        this.toastService.success('Leases retrieved successfully');
        this.syncSelectedAgreementAfterLoad(previousSelectedId);
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
    this.loadPackageTypes();
  }

  onRefresh(): void {
    this.loadPackageTypes();
  }

  onSearch(): void {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadPackageTypes();
  }

  onFilterChange(): void {
    this.onSearch();
  }

  clearFilters(): void {
    this.searchText = '';
    this.fundingStatus = '';
    this.paymentStatus = '';
    this.soilType = '';
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadPackageTypes();
  }

  onView(lease: InvestmentPackageTypeAgreement): void {
    this.pendingForcedTab = null;
    this.selectedAgreement = {...lease};
    this.detailRefreshKey++;
    this.plot = null;
    this.packageInvestments = [];
    this.showCreateModal = false;
    this.showEditModal = false;
    if (this.activeTab === 'investor') {
      this.loadPackageInvestments(lease.id);
    }
  }

  private refreshPackageInvestmentsIfNeeded(): void {
    if (this.activeTab === 'investor' && this.selectedAgreement?.id) {
      this.loadPackageInvestments(this.selectedAgreement.id);
    }
  }

  onEdit(lease: InvestmentPackageTypeAgreement): void {
    this.selectedAgreement = {...lease};
    this.showCreateModal = false;
    this.showEditModal = true;
  }

  onEditPackage(lease: InvestmentPackageTypeAgreement): void {
    this.selectedAgreement = {...lease};
    this.showDeleteModal = false;
    this.showEditInvestmentPackageModal = true;
  }

  onDeletePackage(lease: InvestmentPackageTypeAgreement): void {
    this.selectedAgreement = {...lease};
    this.showEditInvestmentPackageModal = false;
    this.showDeleteModal = true;
  }

  handleDeleteConfirmation(): void {
    if (!this.selectedAgreement?.id) return;

    this.deleting = true;
    this.investmentPackageService.deleteInvestmentPackage(this.selectedAgreement.id).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteModal = false;
        this.selectedAgreement = null;
        this.toastService.success('Investment package deleted successfully');
        this.loadPackageTypes();
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
    this.loadPackageTypes();
  }

  onApprovePackageType(lease: InvestmentPackageTypeAgreement): void {
    // Open admin action modal (Approve/Reject).
    this.selectedAgreement = {...lease};
    this.showEditModal = false;
    this.showCreateModal = false;
    this.showAdminActionModal = true;
  }

  onChooseCandidateAction(lease: InvestmentPackageTypeAgreement): void {
    this.onView(lease);
    this.pendingForcedTab = 'choose-candidate';
    this.activeTab = 'choose-candidate';
  }

  onContractAction(lease: InvestmentPackageTypeAgreement): void {
    this.onView(lease);
    this.pendingForcedTab = 'contract';
    this.activeTab = 'contract';
  }

  onCandidatesChosen(): void {
    this.detailRefreshKey++;
    this.loadPackageTypes();
  }

  onAgreementCreated(): void {
    this.detailRefreshKey++;
    this.loadPackageTypes();
  }

  onAdminDecision(decision: AdminInvestmentPackageTypeDecision): void {
    const leaseId = this.getPackageTypeAgreementId(this.selectedAgreement);
    if (!leaseId) return;

    if (this.adminActionLoading) return;
    this.adminActionLoading = true;

    this.investmentPackageTypeService.adminDecide(leaseId, decision).subscribe({
      next: (res: ApiResponse<InvestmentPackageTypeAgreement>) => {
        this.adminActionLoading = false;
        this.toastService.success(
          decision === 'ACCEPTED' ? 'Lease activated successfully' : 'Lease rejected successfully',
          'Admin Lease Action',
        );
        this.detailRefreshKey++;
        this.selectedAgreement = res?.data ?? null;
        this.loadPackageTypes();
      },
      error: () => {
        this.adminActionLoading = false;
      },
    });
  }

  onInvest(lease: InvestmentPackageTypeAgreement): void {
    this.selectedAgreement = {...lease};
    this.showCreateInvestmentModal = true;
  }

  onInvestmentCreated(): void {
    this.showCreateInvestmentModal = false;
    this.toastService.success('Investment registered successfully');
    this.loadPackageTypes();
  }

  onPackageTypeCreated(): void {
    this.showCreateModal = false;
    this.plot = null;
    this.detailRefreshKey++;
    this.loadPackageTypes();
    this.loadInvestorPlots();
  }

  onPackageTypeUpdated(): void {
    this.showEditModal = false;
    this.detailRefreshKey++;
    this.loadPackageTypes();
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
      void this.router.navigate(['/investment-package-types', this.routeSegment, 'plot', plot.id]);
      return;
    }

    this.plot = {...plot};
    this.selectedAgreement = null;
  }

  public onChoosePlot(plot: FarmPlot): void {
    this.plot = {...plot};
    this.selectedAgreement = null;
    this.showCreateModal = true;
  }

  public openCreatePackageTypeFromPreview(): void {
    if (!this.plot) return;
    this.selectedAgreement = null;
    this.showCreateModal = true;
  }

  formatAmount(value: number | undefined): string {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(
      value,
    );
  }

  private onDownload(r: InvestmentPackageTypeAgreement) {
    const leaseId = this.getPackageTypeAgreementId(r);
    if (!leaseId) {
      return;
    }

    this.contractLoading = true;
    this.contractHtml = '';
    this.contractFileName = `lease-contract-${leaseId}.pdf`;
    this.investmentPackageTypeService.getContractHtml(leaseId).subscribe({
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
