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
import {PageResponse} from '../../../../shared/models/api-response.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {TableQueryParams} from '../../../../shared/data-table/models/table-query-params.model';
import {
  PageSplitRightAction
} from '../../../../shared/components/page-split-layout/page-split-layout/page-split-right-action.model';
import {AuthService} from '../../../auth/services/auth.service';
import {TabItem} from "../../../../shared/tabs/models/tab-item.model";
import {environment} from '../../../../../environments/environment';

@Component({
  selector: 'app-investment-package-type-list',
  standalone: false,
  templateUrl: './investment-package-type-list.component.html',
  styleUrl: './investment-package-type-list.component.css',
})
export class InvestmentPackageTypeListComponent implements OnInit {
  private readonly storageApiUrl = `${environment.apiUrl}/files`;

  // Bidding leaderboard (all investors' bids for the selected package)
  biddingLeaderboard: InvestmentRecord[] = [];
  biddingLeaderboardLoading = false;

  // Subscribed packages ("My farm leases" section)
  subscribedPackageTypes: InvestmentPackageTypeAgreement[] = [];
  subscribedLoading = false;

  // Available packages ("Explore More Farm Plots" section, investor only)
  availablePackageTypes: InvestmentPackageTypeAgreement[] = [];
  availableLoading = false;
  availableTotal = 0;
  availablePageSize = 10;
  availablePageIndex = 1;
  availablePage = 0;
  availableSearchText = '';

  searchText = '';
  fundingStatus: FundingStatus | '' = '';
  paymentStatus: InvestmentPaymentStatus | '' = '';

  adminActiveTab = 'published';
  adminTabs: TabItem[] = [
    {key: 'published', label: 'Published Investments'},
    {key: 'archived', label: 'Archived Investments'},
  ];
  publishedPackages: InvestmentPackageTypeAgreement[] = [];
  archivedPackages: InvestmentPackageTypeAgreement[] = [];

  showCreateModal = false;
  showEditModal = false;
  showEditInvestmentPackageModal = false;
  showCloseModal = false;
  closing = false;
  closeReason = '';
  showCreateInvestmentModal = false;
  selectedAgreement: InvestmentPackageTypeAgreement | null = null;
  investorBidRecord: InvestmentRecord | null = null;
  selectedAgreementStatus: string | null = null;
  detailRefreshKey = 0;
  pendingForcedTab: string | null = null;

  showContractModal = false;
  contractLoading = false;
  contractHtml = '';
  contractFileName = 'lease-contract.html';

  columns: DataTableColumn<InvestmentPackageTypeAgreement>[] = [];
  archivedColumns: DataTableColumn<InvestmentPackageTypeAgreement>[] = [];

  activeTab = 'detail';

  investorActiveTab = 'my-leases';
  investorTabs: TabItem[] = [
    {
      key: 'my-leases',
      label: 'My Farm Leases',
      iconPath: [
        'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2',
        'M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
        'M9 12h6m-6 4h6',
      ],
    },
    {
      key: 'explore',
      label: 'Explore More Farm Plots',
      iconPath: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    },
  ];

  onInvestorTabChange(key: string): void {
    this.investorActiveTab = key;
    if (key === 'explore') {
      this.loadAvailablePackageTypes();
    }
  }

  onAdminTabChange(key: string): void {
    this.adminActiveTab = key;
    const packages = key === 'archived' ? this.archivedPackages : this.publishedPackages;
    this.selectedAgreement = packages.length > 0 ? {...packages[0]} : null;
    if (this.selectedAgreement) this.detailRefreshKey++;
  }

  get isLosingBidder(): boolean {
    return this.isInvestorUser
      && this.investmentPackageType === 'BIDDING'
      && this.investorBidRecord?.status === 'BACKUP';
  }

  /** Winning bidder who has already submitted payment proof, before the admin has created the contract. */
  get isAwaitingContract(): boolean {
    return this.isInvestorUser
      && this.investmentPackageType === 'BIDDING'
      && this.investorBidRecord?.status === 'PAID';
  }

  get tabs(): TabItem[] {
    const contractSigned = this.selectedAgreementStatus === 'ACTIVE';
    const isWinnerAnnounced = this.selectedAgreement?.fundingStatus === 'CLOSED' && contractSigned;
    const hasExtensionWorker = !!this.selectedAgreement?.extensionWorker;
    const isLosingBidder = this.isLosingBidder;

    const result: TabItem[] = [
      {key: 'detail', label: 'Detail'},
      {key: 'farm-plot', label: 'FarmPlot'},
      {key: 'investor', label: 'Investor'},
    ];

    if (this.isAdmin && this.selectedAgreement?.fundingStatus === 'CLOSED') {
      result.push({key: 'contract', label: 'Contract'});
    } else if (this.isInvestorUser && !isLosingBidder && (!!this.selectedAgreement?.agreementId || this.isAwaitingContract)) {
      result.push({key: 'contract', label: 'Contract'});
    }

    if (isWinnerAnnounced && !isLosingBidder) {
      result.push({
        key: 'extension-worker',
        label: 'Extension Worker',
        badge: hasExtensionWorker ? undefined : 1,
      });
    }

    if (hasExtensionWorker && !isLosingBidder) {
      const followUpCount = this.selectedAgreement?.followUpDtoList?.length ?? 0;
      result.push({
        key: 'follow-up',
        label: 'FollowUp',
        badge: followUpCount === 0 ? 1 : undefined,
      });
    }

    return result;
  }

  packageInvestments: InvestmentRecord[] = [];
  packageInvestmentsLoading = false;

  tableRowActions: PageSplitRightAction<InvestmentPackageTypeAgreement>[] = [];
  readonly rightActions: PageSplitRightAction<InvestmentPackageTypeAgreement>[] = [];

  myRequest = true;

  investmentPackageType: InvestmentPackageType = 'LEASING';
  pageTitle = 'Leasing Investment Packages';

  private appliedPackageType: InvestmentPackageType | null = null;

  constructor(
    private investmentPackageTypeService: InvestmentPackageTypeService,
    private investmentPackageService: InvestmentPackageService,
    private toastService: ToastService,
    private authService: AuthService,
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
    const base: DataTableColumn<InvestmentPackageTypeAgreement>[] = [
      {header: 'Title', value: (l) => l.title, cellClass: 'block max-w-[200px] truncate'},
      {header: 'Farm activity', value: (l) => l.farmActivity},
      {header: 'Water source', value: (l) => l.waterSource},
      {header: 'Target', value: (l) => this.formatAmount(l.targetAmount)},
    ];
    this.columns = [...base, {header: 'Funding Status', value: (l) => l.fundingStatus}];
    this.archivedColumns = [...base, {header: 'Package Status', value: (l) => l.packageStatus ?? 'ACTIVE'}];
  }

  private buildTableRowActions(): void {
    if (this.isAdmin) {
      this.tableRowActions = [
        {
          id: 'edit',
          icon: 'edit',
          title: 'Edit',
          visible: (l) => l.fundingStatus !== FundingStatus.CLOSED && l.packageStatus !== 'IN_USE' && l.packageStatus !== 'INACTIVE',
          action: (l) => this.onEditPackage(l),
        },
        {
          id: 'close',
          icon: 'delete',
          title: 'Close',
          visible: (l) => l.fundingStatus === FundingStatus.OPEN && l.packageStatus !== 'INACTIVE',
          action: (l) => this.onClosePackage(l),
        },
        {
          id: 'review',
          icon: 'check',
          title: this.investmentPackageType === 'BIDDING' ? 'Winning Investor' : 'Winning Investors',
          visible: (l) => this.canAdminReview(l),
          action: (l) => this.onChooseCandidateAction(l),
        },
        {
          id: 'contract',
          icon: 'send',
          title: 'Create Contract',
          visible: (l) =>
            l.fundingStatus === FundingStatus.CLOSED &&
            !l.agreementId,
          action: (l) => this.onContractAction(l),
        },
        {
          id: 'view-contract',
          icon: 'document',
          title: 'View Contract',
          visible: (l) =>
            !!l.agreementId &&
            l.status !== 'ACTIVE',
          action: (l) => this.onContractAction(l),
        },
        {
          id: 'assign-extension-worker',
          icon: 'assign',
          title: 'Assign Extension Worker',
          visible: (l) =>
            l.fundingStatus === FundingStatus.CLOSED &&
            !!l.agreementId &&
            l.status === 'ACTIVE' &&
            !l.extensionWorker,
          action: (l) => this.onAssignExtensionWorkerAction(l),
        },
        {
          id: 'change-extension-worker',
          icon: 'refresh',
          title: 'Change Extension Worker',
          visible: (l) =>
            l.fundingStatus === FundingStatus.CLOSED &&
            !!l.extensionWorker,
          action: (l) => this.onAssignExtensionWorkerAction(l),
        },
        {
          id: 'closed-by-admin',
          icon: 'ban',
          title: 'Closed by admin',
          visible: (l) => l.packageStatus === 'INACTIVE' && l.fundingStatus === FundingStatus.FAILED,
          disabled: () => true,
          action: () => {},
        },
      ];
      return;
    }

    if (this.isInvestorUser) {
      this.tableRowActions = [
        {
          id: 'invest',
          icon: 'plus',
          title: this.investmentPackageType === 'BIDDING' ? 'Bid' : 'Invest',
          visible: (r) =>
            r.fundingStatus === FundingStatus.OPEN &&
            (this.investmentPackageType !== 'BIDDING' || !this.investorBidRecord),
          action: (r) => this.onInvest(r),
        },
        {
          id: 'update-bid',
          icon: 'edit',
          title: 'Update Bid',
          visible: (r) =>
            this.investmentPackageType === 'BIDDING' &&
            r.fundingStatus === FundingStatus.OPEN &&
            !!this.investorBidRecord,
          action: (r) => this.onUpdateBid(r),
        },
        {
          id: 'agree-contract',
          icon: 'check',
          title: 'Agree on Contract',
          visible: (r) =>
            !!r.agreementId &&
            r.status === 'SENT',
          action: (r) => this.onAgreeOnContractAction(r),
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
    return this.investmentPackageType !== 'LEASING' && this.hasAppliedInvestors(lease);
  }

  public shouldShowPackageTypeEditButton(_lease: InvestmentPackageTypeAgreement | null | undefined): boolean {
    return false;
  }

  get rightPanelItem(): InvestmentPackageTypeAgreement | null {
    return this.selectedAgreement;
  }

  get rightPanelTitle(): string {
    return this.getPackageDetailTitle();
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
      if (this.investmentPackageType === 'BIDDING') {
        this.loadBiddingLeaderboard(this.selectedAgreement.id);
      }
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
      investmentPackageIds: [packageId],
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
    this.packageInvestments = [];
    this.searchText = '';
    this.fundingStatus = '';
    this.paymentStatus = '';
    this.availableSearchText = '';
    this.availablePage = 0;
    this.availablePageIndex = 1;
    this.adminActiveTab = 'published';
    this.publishedPackages = [];
    this.archivedPackages = [];
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
      investmentPackageType: this.investmentPackageType,
      sortBy: 'fundingDeadline',
      sortDirection: 'DESC',
      page: 0,
      size: 100,
    };
  }

  private getPackageTypeAgreementId(agreement: InvestmentPackageTypeAgreement | null | undefined): string | null {
    if (!agreement) {
      return null;
    }
    return agreement.agreementId ?? agreement.id ?? null;
  }

  private syncSelectedAgreementAfterLoad(previousId?: string | null): void {
    if (this.isAdmin) {
      if (previousId) {
        const match = [...this.publishedPackages, ...this.archivedPackages].find((l) => l.id === previousId);
        if (match) {
          this.selectedAgreement = {...match};
          this.refreshPackageInvestmentsIfNeeded();
          this.refreshInvestorBidRecordIfNeeded();
          return;
        }
      }
      const activeList = this.adminActiveTab === 'archived' ? this.archivedPackages : this.publishedPackages;
      this.selectedAgreement = activeList.length > 0 ? {...activeList[0]} : null;
      if (this.selectedAgreement) {
        this.detailRefreshKey++;
        this.refreshPackageInvestmentsIfNeeded();
        this.refreshInvestorBidRecordIfNeeded();
      }
      return;
    }

    if (this.subscribedPackageTypes.length === 0) {
      this.selectedAgreement = null;
      return;
    }

    if (previousId) {
      const match = this.subscribedPackageTypes.find((l) => l.id === previousId);
      if (match) {
        this.selectedAgreement = {...match};
        this.refreshPackageInvestmentsIfNeeded();
        this.refreshInvestorBidRecordIfNeeded();
        return;
      }
    }

    this.selectedAgreement = {...this.subscribedPackageTypes[0]};
    this.detailRefreshKey++;
    this.refreshPackageInvestmentsIfNeeded();
    this.refreshInvestorBidRecordIfNeeded();
  }

  private refreshInvestorBidRecordIfNeeded(): void {
    if (this.isInvestorUser && this.investmentPackageType === 'BIDDING' && this.selectedAgreement?.id) {
      this.loadInvestorBidRecord(this.selectedAgreement.id);
    }
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
        return true; // backend InvestmentPackageSpecification already filters by assignedExtensionWorkerId
      }
      return false;
    });
  }

  loadPackageTypes(): void {
    this.loadSubscribedPackageTypes();
    if (this.isInvestorUser) {
      this.loadAvailablePackageTypes();
    }
  }

  private loadSubscribedPackageTypes(): void {
    this.subscribedLoading = true;
    const currentUserId = this.authService.getCurrentUser()?.id;
    const request = this.buildFilterRequest();
    this.investmentPackageTypeService.filter(request).subscribe({
      next: (response: PageResponse<InvestmentPackageTypeAgreement>) => {
        const rawContent = response.content ?? [];
        const previousSelectedId = this.selectedAgreement?.id;
        const filtered = this.filterVisiblePackageTypes(rawContent);

        if (this.isInvestorUser && currentUserId) {
          // Show only packages the investor has applied to (in investorIdList or investorId)
          // After filterVisiblePackageTypes, CLOSED packages are always the user's own.
          // For OPEN packages, check membership in investorIdList.
          this.subscribedPackageTypes = filtered.filter(
            (p) =>
              p.fundingStatus !== FundingStatus.OPEN ||
              p.investorIdList?.includes(currentUserId) ||
              p.investorId === currentUserId,
          );
        } else {
          this.subscribedPackageTypes = filtered;
        }

        if (this.isAdmin) {
          this.publishedPackages = this.subscribedPackageTypes.filter(
            (p) => p.packageStatus !== 'INACTIVE',
          );
          this.archivedPackages = this.subscribedPackageTypes.filter(
            (p) => p.packageStatus === 'INACTIVE',
          );
        }

        this.subscribedLoading = false;
        this.syncSelectedAgreementAfterLoad(previousSelectedId);

        if (this.isInvestorUser && this.subscribedPackageTypes.length === 0) {
          this.onInvestorTabChange('explore');
        }
      },
      error: () => {
        this.subscribedLoading = false;
      },
    });
  }

  private loadAvailablePackageTypes(): void {
    this.availableLoading = true;
    const currentUserId = this.authService.getCurrentUser()?.id;
    this.investmentPackageTypeService.filter({
      searchText: this.availableSearchText.trim() || undefined,
      statuses: [FundingStatus.OPEN],
      investmentPackageType: this.investmentPackageType,
      sortBy: 'fundingDeadline',
      sortDirection: 'DESC',
      page: this.availablePage,
      size: this.availablePageSize,
    }).subscribe({
      next: (response: PageResponse<InvestmentPackageTypeAgreement>) => {
        const raw = response.content ?? [];
        this.availablePackageTypes = currentUserId
          ? raw.filter(
              (p) =>
                !p.investorIdList?.includes(currentUserId) &&
                p.investorId !== currentUserId,
            )
          : raw;
        this.availableTotal = response.totalElements ?? raw.length;
        this.investorTabs = this.investorTabs.map(t =>
          t.key === 'explore' ? { ...t, badge: this.availableTotal || undefined } : t
        );
        this.availableLoading = false;
        if (this.availablePackageTypes.length > 0) {
          this.selectedAgreement = {...this.availablePackageTypes[0]};
          this.detailRefreshKey++;
          this.refreshPackageInvestmentsIfNeeded();
        }
      },
      error: (error) => {
        this.availableLoading = false;
        this.toastService.error(
          error.message || 'Failed to fetch available packages',
          'Fetch Available',
        );
      },
    });
  }

  onRefresh(): void {
    this.loadPackageTypes();
  }

  onFilterChange(): void {
    this.loadSubscribedPackageTypes();
  }

  clearFilters(): void {
    this.searchText = '';
    this.fundingStatus = '';
    this.paymentStatus = '';
    this.loadSubscribedPackageTypes();
  }

  onAvailablePageChange(params: TableQueryParams): void {
    this.availablePageIndex = params.pageIndex;
    this.availablePage = this.availablePageIndex - 1;
    this.availablePageSize = params.pageSize;
    this.loadAvailablePackageTypes();
  }

  onAvailableFilterChange(): void {
    this.availablePage = 0;
    this.availablePageIndex = 1;
    this.loadAvailablePackageTypes();
  }

  clearAvailableFilters(): void {
    this.availableSearchText = '';
    this.availablePage = 0;
    this.availablePageIndex = 1;
    this.loadAvailablePackageTypes();
  }

  onView(lease: InvestmentPackageTypeAgreement): void {
    // The detail panel's own agreement-loading is deduped per agreementId (it never re-fetches or
    // re-emits agreementStatusChanged for an agreement it already loaded), so reselecting the *same*
    // package must not throw away the status we already have — there'd be nothing left to repopulate it.
    const isSamePackage = this.selectedAgreement?.id === lease.id;
    this.pendingForcedTab = null;
    this.selectedAgreement = {...lease};
    if (!isSamePackage) {
      this.selectedAgreementStatus = null;
      this.packageInvestments = [];
      this.investorBidRecord = null;
    }
    this.detailRefreshKey++;
    this.showCreateModal = false;
    this.showEditModal = false;
    if (this.activeTab === 'investor') {
      this.loadPackageInvestments(lease.id);
    }
    if (this.isInvestorUser && this.investmentPackageType === 'BIDDING') {
      this.loadInvestorBidRecord(lease.id);
    }
  }

  private loadInvestorBidRecord(packageId: string): void {
    this.investmentPackageService.filterInvestments({
      investmentPackageIds: [packageId],
      page: 0,
      size: 1,
    }).subscribe({
      next: (response) => {
        this.investorBidRecord = response.content?.[0] ?? null;
        this.buildTableRowActions();
      },
      error: () => {
        this.investorBidRecord = null;
      },
    });
  }

  private refreshPackageInvestmentsIfNeeded(): void {
    if (this.activeTab === 'investor' && this.selectedAgreement?.id) {
      this.loadPackageInvestments(this.selectedAgreement.id);
      if (this.investmentPackageType === 'BIDDING') {
        this.loadBiddingLeaderboard(this.selectedAgreement.id);
      }
    }
  }

  loadBiddingLeaderboard(packageId: string): void {
    this.biddingLeaderboardLoading = true;
    this.investmentPackageService.getBiddingLeaderboard(packageId).subscribe({
      next: (records) => {
        this.biddingLeaderboard = records;
        this.biddingLeaderboardLoading = false;
      },
      error: () => {
        this.biddingLeaderboard = [];
        this.biddingLeaderboardLoading = false;
      },
    });
  }

  onEdit(lease: InvestmentPackageTypeAgreement): void {
    this.selectedAgreement = {...lease};
    this.showCreateModal = false;
    this.showEditModal = true;
  }

  onEditPackage(lease: InvestmentPackageTypeAgreement): void {
    this.selectedAgreement = {...lease};
    this.showCloseModal = false;
    this.showEditInvestmentPackageModal = true;
  }

  onClosePackage(lease: InvestmentPackageTypeAgreement): void {
    this.selectedAgreement = {...lease};
    this.showEditInvestmentPackageModal = false;
    this.closeReason = '';
    this.showCloseModal = true;
  }

  handleCloseConfirmation(): void {
    if (!this.selectedAgreement?.id || !this.closeReason.trim()) return;

    this.closing = true;
    this.investmentPackageService.closeInvestmentPackage(this.selectedAgreement.id, this.closeReason.trim()).subscribe({
      next: () => {
        this.closing = false;
        this.showCloseModal = false;
        this.closeReason = '';
        this.toastService.success('Investment package closed successfully');
        this.detailRefreshKey++;
        this.loadPackageTypes();
      },
      error: (error) => {
        this.closing = false;
        this.toastService.error(
          error.message || 'Failed to close investment package',
          'Close Investment Package',
        );
      },
    });
  }

  onInvestmentPackageUpdated(): void {
    this.showEditInvestmentPackageModal = false;
    this.detailRefreshKey++;
    this.loadPackageTypes();
  }

  onChooseCandidateAction(lease: InvestmentPackageTypeAgreement): void {
    this.onView(lease);
    this.pendingForcedTab = 'investor';
    this.activeTab = 'investor';
    this.loadPackageInvestments(lease.id);
    if (this.investmentPackageType === 'BIDDING') {
      this.loadBiddingLeaderboard(lease.id);
    }
  }

  onContractAction(lease: InvestmentPackageTypeAgreement): void {
    this.onView(lease);
    this.pendingForcedTab = 'contract';
    this.activeTab = 'contract';
  }

  onAssignExtensionWorkerAction(lease: InvestmentPackageTypeAgreement): void {
    this.onView(lease);
    this.pendingForcedTab = 'extension-worker';
    this.activeTab = 'extension-worker';
  }

  onAgreeOnContractAction(lease: InvestmentPackageTypeAgreement): void {
    this.onView(lease);
    this.pendingForcedTab = 'contract';
    this.activeTab = 'contract';
  }

  onCandidatesChosen(): void {
    this.detailRefreshKey++;
    this.loadPackageTypes();
    if (this.selectedAgreement?.id) {
      this.loadPackageInvestments(this.selectedAgreement.id);
      if (this.investmentPackageType === 'BIDDING') {
        this.loadBiddingLeaderboard(this.selectedAgreement.id);
      }
    }
  }

  onAgreementCreated(): void {
    this.detailRefreshKey++;
    this.loadPackageTypes();
  }

  onDetailPanelInvestClicked(): void {
    this.showCreateInvestmentModal = true;
  }

  onInvest(lease: InvestmentPackageTypeAgreement): void {
    this.selectedAgreement = {...lease};
    this.investorBidRecord = null;
    this.showCreateInvestmentModal = true;
  }

  onUpdateBid(lease: InvestmentPackageTypeAgreement): void {
    this.selectedAgreement = {...lease};
    this.showCreateInvestmentModal = true;
  }

  onInvestmentCreated(): void {
    this.showCreateInvestmentModal = false;
    this.investorBidRecord = null;
    if (this.investmentPackageType === 'BIDDING') {
      this.toastService.success('Bid registered successfully');
    } else {
      this.toastService.success('Investment registered successfully');
    }
    this.loadPackageTypes();
    if (this.selectedAgreement && this.isInvestorUser && this.investmentPackageType === 'BIDDING') {
      this.loadInvestorBidRecord(this.selectedAgreement.id);
    }
  }

  onPackageTypeCreated(): void {
    this.showCreateModal = false;
    this.detailRefreshKey++;
    this.loadPackageTypes();
  }

  onPackageTypeUpdated(): void {
    this.showEditModal = false;
    this.detailRefreshKey++;
    this.loadPackageTypes();
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
