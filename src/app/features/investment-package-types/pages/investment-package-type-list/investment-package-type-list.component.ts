import {Component, DestroyRef, OnInit} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {jsPDF} from 'jspdf';
import {InvestmentPackageTypeAgreement, InvestmentPackageTypeFilterRequest} from '../../models/investment-package-type.model';
import {ActivatedRoute, Router} from '@angular/router';
import {
  InvestmentPackage,
  InvestmentPackageStatus,
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
import {packageStatusBadgeClass} from '../../../investment-package/utils/investment-package-status.util';

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

  // Extension worker: "My Farm Plots" tab — active (non-terminal) assignments.
  subscribedPackageTypes: InvestmentPackageTypeAgreement[] = [];
  subscribedLoading = false;

  // Extension worker: "History" tab — completed/deactivated assignments.
  subscribedHistoryPackageTypes: InvestmentPackageTypeAgreement[] = [];
  subscribedHistoryLoading = false;

  // Investor: "My Farm Leases" tab — active (non-terminal) packages, loaded on tab open.
  myLeasesPackageTypes: InvestmentPackageTypeAgreement[] = [];
  myLeasesLoading = false;

  // Investor: "History" tab — completed/deactivated packages, loaded on tab open.
  historyPackageTypes: InvestmentPackageTypeAgreement[] = [];
  historyLoading = false;

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
  publishedLoading = false;
  archivedPackages: InvestmentPackageTypeAgreement[] = [];
  archivedLoading = false;

  showCreateModal = false;
  showEditModal = false;
  showEditInvestmentPackageModal = false;
  selectedInvestmentPackageForEdit: InvestmentPackage | null = null;
  showCloseModal = false;
  closing = false;
  closeReason = '';
  showCompleteModal = false;
  completing = false;
  completionRemark = '';
  packageToComplete: InvestmentPackageTypeAgreement | null = null;
  showDeactivateModal = false;
  deactivating = false;
  deactivationReason = '';
  packageToDeactivate: InvestmentPackageTypeAgreement | null = null;
  showCreateInvestmentModal = false;
  selectedAgreement: InvestmentPackageTypeAgreement | null = null;
  investorBidRecord: InvestmentRecord | null = null;
  selectedAgreementStatus: string | null = null;
  tabs: TabItem[] = [];
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
    {
      key: 'history',
      label: 'History',
      iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ];

  onInvestorTabChange(key: string): void {
    this.investorActiveTab = key;
    if (key === 'explore') {
      this.loadAvailablePackageTypes();
    } else if (key === 'history') {
      this.loadHistory();
    } else {
      this.loadMyLeases();
    }
  }

  onAdminTabChange(key: string): void {
    this.adminActiveTab = key;
    if (key === 'archived') {
      this.loadArchived();
    } else {
      this.loadPublished();
    }
  }

  extensionWorkerActiveTab = 'current';
  extensionWorkerTabs: TabItem[] = [
    {key: 'current', label: 'My Farm Plots'},
    {key: 'history', label: 'History'},
  ];

  onExtensionWorkerTabChange(key: string): void {
    this.extensionWorkerActiveTab = key;
    if (key === 'history') {
      this.loadSubscribedHistory();
    } else {
      this.loadSubscribedPackageTypes();
    }
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

  private computeTabs(): TabItem[] {
    // Synchronous, monotonic stage signals — once true these stay true as the deal progresses
    // (fundingStatus moving CLOSED -> FUNDED must not make earlier-stage tabs disappear).
    // `status` (not the async-fetched agreement status) mirrors the same field the
    // "Assign Extension Worker" row action already trusts for "contract signed". Once a worker
    // is actually assigned that's on its own proof the contract was signed, even once `status`
    // has moved on past 'ACTIVE' (e.g. it's absent entirely on a COMPLITED archived package).
    // A deal can later be force-closed to a terminal fundingStatus (e.g. FAILED/deactivated)
    // well after it actually had a contract, worker, and follow-ups — so "has a contract stage
    // been reached" must OR in the structural evidence (agreementId existing) rather than trust
    // fundingStatus alone, or the Contract tab would vanish on exactly those archived packages.
    const hasExtensionWorker = !!this.selectedAgreement?.extensionWorker;
    const hasAgreement = !!this.selectedAgreement?.agreementId;
    const contractSigned = hasAgreement && (this.selectedAgreement?.status === 'ACTIVE' || hasExtensionWorker);
    const fundingClosedOrLater =
      this.selectedAgreement?.fundingStatus === 'CLOSED' ||
      this.selectedAgreement?.fundingStatus === 'FUNDED' ||
      hasAgreement;
    const isLosingBidder = this.isLosingBidder;

    const result: TabItem[] = [
      {key: 'detail', label: 'Detail'},
      {key: 'farm-plot', label: 'FarmPlot'},
      {key: 'investor', label: 'Investor'},
    ];

    // CROWDFUNDING: show Payment tab for chosen investor (PENDING = needs to pay; PAID = submitted; REJECTED = must re-upload)
    const isChosenCrowdfundingInvestor =
      this.isInvestorUser &&
      this.investmentPackageType === 'CROWDFUNDING' &&
      (this.investorBidRecord?.status === 'PENDING' ||
       this.investorBidRecord?.status === 'PAID' ||
       this.investorBidRecord?.status === 'REJECTED' ||
       this.investorBidRecord?.status === 'ACCEPTED');

    if (isChosenCrowdfundingInvestor) {
      const investorIdx = result.findIndex(t => t.key === 'investor');
      result.splice(investorIdx + 1, 0, {key: 'payment', label: 'Payment'});
    }

    if (this.isAdmin && fundingClosedOrLater) {
      result.push({key: 'contract', label: 'Contract'});
    } else if (
      this.isInvestorUser && !isLosingBidder &&
      !!this.selectedAgreement?.investorIdList?.includes(this.authService.getCurrentUser()?.id ?? '') &&
      (!!this.selectedAgreement?.agreementId || this.isAwaitingContract)
    ) {
      result.push({key: 'contract', label: 'Contract'});
    }

    if (contractSigned && !isLosingBidder) {
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

  private recomputeTabs(): void {
    this.tabs = this.computeTabs();
  }

  onAgreementStatusChanged(status: string | null): void {
    this.selectedAgreementStatus = status;
    this.recomputeTabs();
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
      {header: 'Title', value: (l) => this.truncateText(l.title), cellClass: 'block max-w-[200px] truncate'},
      {header: 'Farm activity', value: (l) => l.farmActivity},
      {header: 'Water source', value: (l) => l.waterSource},
      {header: 'Target', value: (l) => this.formatAmount(l.targetAmount)},
    ];
    this.columns = [...base, {header: 'Funding Status', value: (l) => l.fundingStatus}];
    this.archivedColumns = [...base, {header: 'Package Status', value: (l) => l.packageStatus ?? 'ACTIVE', cellClass: (l) => packageStatusBadgeClass(l.packageStatus)}];
  }

  private truncateText(value: string | undefined | null, max = 15): string {
    const text = value ?? '';
    return text.length > max ? `${text.slice(0, max)}...` : text;
  }

  private buildTableRowActions(): void {
    if (this.isAdmin) {
      this.tableRowActions = [
        {
          id: 'edit',
          icon: 'edit',
          title: 'Edit',
          visible: (l) => l.fundingStatus !== FundingStatus.CLOSED && l.packageStatus !== 'IN_USE' && l.packageStatus !== 'INACTIVE' && !this.isSignedAndAssigned(l),
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
          visible: (l) => this.canAdminReview(l) && !this.isSignedAndAssigned(l),
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
            l.status !== 'ACTIVE' &&
            !this.isSignedAndAssigned(l),
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
            l.fundingStatus === FundingStatus.FUNDED &&
            !!l.extensionWorker,
          action: (l) => this.onAssignExtensionWorkerAction(l),
        },
        {
          id: 'view-followups',
          icon: 'eye',
          title: 'View Follow-ups',
          visible: (l) => this.isCompletedOperatingState(l),
          action: (l) => this.onViewFollowUpsAction(l),
        },
        {
          id: 'complete',
          icon: 'complete',
          title: 'Complete',
          visible: (l) => this.isCompletedOperatingState(l),
          action: (l) => this.onCompleteAction(l),
        },
        {
          id: 'deactivate',
          icon: 'ban',
          title: 'Deactivate',
          visible: (l) => this.isCompletedOperatingState(l),
          action: (l) => this.onDeactivateAction(l),
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
      const currentUserId = this.authService.getCurrentUser()?.id;
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
          id: 'pay',
          icon: 'currency',
          title: 'Pay',
          visible: (r) =>
            this.investmentPackageType === 'CROWDFUNDING' &&
            r.fundingStatus === FundingStatus.CLOSED &&
            this.investorBidRecord?.status === 'PENDING',
          action: (r) => this.onPayAction(r),
        },
        {
          id: 'agree-contract',
          icon: 'check',
          title: 'Agree on Contract',
          visible: (r) =>
            this.investmentPackageType !== 'CROWDFUNDING' &&
            !!r.agreementId &&
            r.status === 'SENT',
          action: (r) => this.onAgreeOnContractAction(r),
        },
        {
          id: 'sign-contract',
          icon: 'sign',
          title: 'Sign Contract',
          visible: (r) =>
            this.investmentPackageType === 'CROWDFUNDING' &&
            r.fundingStatus === FundingStatus.CLOSED &&
            !!r.agreementId,
          action: (r) => this.onAgreeOnContractAction(r),
        },
        {
          id: 'download',
          icon: 'download',
          title: 'Download',
          visible: (r) =>
            !!r.agreementId &&
            (r.fundingStatus === FundingStatus.FUNDED || r.fundingStatus === FundingStatus.FAILED) &&
            !!r.investorIdList?.includes(this.authService.getCurrentUser()?.id ?? ''),
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

  /** Contract signed (agreement created) and extension worker assigned. fundingStatus is FUNDED
   *  in this state (worker assignment flips it from CLOSED to FUNDED). Covers both the active
   *  operating state and the already-completed (COMPLITED) state. */
  private isSignedAndAssigned(lease: InvestmentPackageTypeAgreement): boolean {
    return lease.fundingStatus === FundingStatus.FUNDED
      && !!lease.agreementId
      && !!lease.extensionWorker;
  }

  /** Active operating state: signed + worker assigned and not yet completed. This is the only
   *  state where the View Follow-ups and Complete row actions should appear. */
  private isCompletedOperatingState(lease: InvestmentPackageTypeAgreement): boolean {
    return this.isSignedAndAssigned(lease) && lease.packageStatus !== 'COMPLITED';
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
    if ((tab === 'investor' || tab === 'payment' || tab === 'contract') && this.selectedAgreement?.id) {
      this.loadPackageInvestments(this.selectedAgreement.id);
      if (this.investmentPackageType === 'BIDDING' || this.investmentPackageType === 'CROWDFUNDING') {
        this.loadBiddingLeaderboard(this.selectedAgreement.id);
      }
    }
  }

  onExtensionWorkerAssigned(pkg: InvestmentPackage): void {
    this.selectedAgreement = pkg as InvestmentPackageTypeAgreement;
    this.detailRefreshKey++;
    this.recomputeTabs();
    this.refreshCurrentTab(this.selectedAgreement?.id);
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
    this.recomputeTabs();

    const queryParams = this.route.snapshot.queryParamMap;
    const deepLinkPackageId = queryParams.get('packageId');
    const deepLinkTab = queryParams.get('tab');
    if (deepLinkPackageId) {
      if (deepLinkTab === 'archived' || deepLinkTab === 'published') {
        this.adminActiveTab = deepLinkTab;
      }
      if (deepLinkTab === 'archived') {
        this.investorActiveTab = 'history';
        this.extensionWorkerActiveTab = 'history';
      }
      this.refreshCurrentTab(deepLinkPackageId);
    } else {
      this.refreshCurrentTab();
    }
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
    this.investorActiveTab = 'my-leases';
    this.myLeasesPackageTypes = [];
    this.historyPackageTypes = [];
    this.availablePackageTypes = [];
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

  get isRightPanelLoading(): boolean {
    if (this.isInvestorUser) {
      if (this.investorActiveTab === 'my-leases') return this.myLeasesLoading;
      if (this.investorActiveTab === 'explore') return this.availableLoading;
      return this.historyLoading;
    }
    if (this.isAdmin) {
      return this.adminActiveTab === 'published' ? this.publishedLoading : this.archivedLoading;
    }
    return this.extensionWorkerActiveTab === 'current' ? this.subscribedLoading : this.subscribedHistoryLoading;
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

  /** Selects `previousId` if it's still present in `list` (keeps the acted-on row selected across a
   *  refresh), otherwise falls back to the list's first row, or clears selection if the list is empty. */
  private selectFromList(list: InvestmentPackageTypeAgreement[], previousId?: string | null): void {
    if (previousId) {
      const match = list.find((l) => l.id === previousId);
      if (match) {
        this.selectedAgreement = {...match};
        this.refreshPackageInvestmentsIfNeeded();
        this.refreshInvestorBidRecordIfNeeded();
        return;
      }
    }

    this.selectedAgreement = list.length > 0 ? {...list[0]} : null;
    if (this.selectedAgreement) {
      this.detailRefreshKey++;
      this.refreshPackageInvestmentsIfNeeded();
      this.refreshInvestorBidRecordIfNeeded();
    }
  }

  private refreshInvestorBidRecordIfNeeded(): void {
    if (this.isInvestorUser && (this.investmentPackageType === 'BIDDING' || this.investmentPackageType === 'CROWDFUNDING') && this.selectedAgreement?.id) {
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

  /** Loads only whichever tab is currently active for the current role — the one entry point every
   *  initial-load and post-mutation refresh should go through, so tabs the user isn't looking at are
   *  never fetched. Pass the current selection's id to keep it selected if it's still present. */
  refreshCurrentTab(previousId?: string | null): void {
    if (this.isAdmin) {
      if (this.adminActiveTab === 'archived') {
        this.loadArchived(previousId);
      } else {
        this.loadPublished(previousId);
      }
      return;
    }

    if (this.isInvestorUser) {
      if (this.investorActiveTab === 'explore') {
        this.loadAvailablePackageTypes();
      } else if (this.investorActiveTab === 'history') {
        this.loadHistory(previousId);
      } else {
        this.loadMyLeases(previousId);
      }
      return;
    }

    if (this.extensionWorkerActiveTab === 'history') {
      this.loadSubscribedHistory(previousId);
    } else {
      this.loadSubscribedPackageTypes(previousId);
    }
  }

  private fetchPackageTypes(packageStatuses?: InvestmentPackageStatus[]) {
    return this.investmentPackageTypeService.filter({
      ...this.buildFilterRequest(),
      packageStatuses,
    });
  }

  /** Show only packages the investor has applied to (in investorIdList or investorId). After
   *  filterVisiblePackageTypes, CLOSED packages are always the user's own; for OPEN packages
   *  (a brand-new package can be packageStatus ACTIVE and fundingStatus OPEN at once, before anyone
   *  has applied), check membership explicitly so un-applied-to packages don't leak into My Leases/History. */
  private filterOwnedByCurrentInvestor(items: InvestmentPackageTypeAgreement[]): InvestmentPackageTypeAgreement[] {
    if (!this.isInvestorUser) {
      return items;
    }
    const currentUserId = this.authService.getCurrentUser()?.id;
    if (!currentUserId) {
      return items;
    }
    return items.filter(
      (p) =>
        p.fundingStatus !== FundingStatus.OPEN ||
        p.investorIdList?.includes(currentUserId) ||
        p.investorId === currentUserId,
    );
  }

  /** Extension worker: "My Farm Plots" tab — active (non-terminal) assignments. */
  private loadSubscribedPackageTypes(previousId?: string | null): void {
    this.subscribedLoading = true;
    this.fetchPackageTypes(['ACTIVE', 'IN_USE']).subscribe({
      next: (response: PageResponse<InvestmentPackageTypeAgreement>) => {
        this.subscribedPackageTypes = this.filterVisiblePackageTypes(response.content ?? []);
        this.subscribedLoading = false;
        if (this.extensionWorkerActiveTab !== 'current') return;
        this.selectFromList(this.subscribedPackageTypes, previousId);
        this.recomputeTabs();
      },
      error: () => {
        this.subscribedLoading = false;
      },
    });
  }

  /** Extension worker: "History" tab — completed/deactivated assignments. */
  private loadSubscribedHistory(previousId?: string | null): void {
    this.subscribedHistoryLoading = true;
    this.fetchPackageTypes(['INACTIVE', 'COMPLITED']).subscribe({
      next: (response: PageResponse<InvestmentPackageTypeAgreement>) => {
        this.subscribedHistoryPackageTypes = this.filterVisiblePackageTypes(response.content ?? []);
        this.subscribedHistoryLoading = false;
        if (this.extensionWorkerActiveTab !== 'history') return;
        this.selectFromList(this.subscribedHistoryPackageTypes, previousId);
        this.recomputeTabs();
      },
      error: () => {
        this.subscribedHistoryLoading = false;
      },
    });
  }

  loadMyLeases(previousId?: string | null): void {
    this.myLeasesLoading = true;
    this.fetchPackageTypes(['ACTIVE', 'IN_USE']).subscribe({
      next: (response: PageResponse<InvestmentPackageTypeAgreement>) => {
        const filtered = this.filterVisiblePackageTypes(response.content ?? []);
        this.myLeasesPackageTypes = this.filterOwnedByCurrentInvestor(filtered);
        this.myLeasesLoading = false;
        // Guard against a stale response landing after the user already switched tabs.
        if (this.investorActiveTab !== 'my-leases') return;
        this.selectFromList(this.myLeasesPackageTypes, previousId);
        this.recomputeTabs();

        if (this.myLeasesPackageTypes.length === 0) {
          this.onInvestorTabChange('explore');
        }
      },
      error: () => {
        this.myLeasesLoading = false;
      },
    });
  }

  loadHistory(previousId?: string | null): void {
    this.historyLoading = true;
    this.fetchPackageTypes(['INACTIVE', 'COMPLITED']).subscribe({
      next: (response: PageResponse<InvestmentPackageTypeAgreement>) => {
        const filtered = this.filterVisiblePackageTypes(response.content ?? []);
        this.historyPackageTypes = this.filterOwnedByCurrentInvestor(filtered);
        this.historyLoading = false;
        if (this.investorActiveTab !== 'history') return;
        this.selectFromList(this.historyPackageTypes, previousId);
        this.recomputeTabs();
      },
      error: () => {
        this.historyLoading = false;
      },
    });
  }

  loadPublished(previousId?: string | null): void {
    this.publishedLoading = true;
    this.fetchPackageTypes(['ACTIVE', 'IN_USE']).subscribe({
      next: (response: PageResponse<InvestmentPackageTypeAgreement>) => {
        this.publishedPackages = this.filterVisiblePackageTypes(response.content ?? []);
        this.publishedLoading = false;
        if (this.adminActiveTab !== 'published') return;
        this.selectFromList(this.publishedPackages, previousId);
        this.recomputeTabs();
      },
      error: () => {
        this.publishedLoading = false;
      },
    });
  }

  loadArchived(previousId?: string | null): void {
    this.archivedLoading = true;
    this.fetchPackageTypes(['INACTIVE', 'COMPLITED']).subscribe({
      next: (response: PageResponse<InvestmentPackageTypeAgreement>) => {
        this.archivedPackages = this.filterVisiblePackageTypes(response.content ?? []);
        this.archivedLoading = false;
        if (this.adminActiveTab !== 'archived') return;
        this.selectFromList(this.archivedPackages, previousId);
        this.recomputeTabs();
      },
      error: () => {
        this.archivedLoading = false;
      },
    });
  }

  private loadAvailablePackageTypes(): void {
    this.availableLoading = true;
    const currentUserId = this.authService.getCurrentUser()?.id;
    this.investmentPackageTypeService.filterPublished({
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
        if (this.availablePackageTypes.length > 0 && this.investorActiveTab === 'explore') {
          this.selectedAgreement = {...this.availablePackageTypes[0]};
          this.detailRefreshKey++;
          this.refreshPackageInvestmentsIfNeeded();
          this.recomputeTabs();
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
    this.refreshCurrentTab(this.selectedAgreement?.id);
  }

  onFilterChange(): void {
    this.refreshCurrentTab(this.selectedAgreement?.id);
  }

  clearFilters(): void {
    this.searchText = '';
    this.fundingStatus = '';
    this.paymentStatus = '';
    this.refreshCurrentTab(this.selectedAgreement?.id);
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
    if (this.activeTab === 'investor' ||
        this.activeTab === 'contract' ||
        (this.isAdmin && this.investmentPackageType === 'CROWDFUNDING') ||
        (this.isInvestorUser && this.investmentPackageType === 'CROWDFUNDING')) {
      this.loadPackageInvestments(lease.id);
      if (this.investmentPackageType === 'CROWDFUNDING') {
        this.loadBiddingLeaderboard(lease.id);
      }
    }
    if (this.isInvestorUser && (this.investmentPackageType === 'BIDDING' || this.investmentPackageType === 'CROWDFUNDING')) {
      this.loadInvestorBidRecord(lease.id);
    }
    this.recomputeTabs();
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
        this.recomputeTabs();
      },
      error: () => {
        this.investorBidRecord = null;
        this.recomputeTabs();
      },
    });
  }

  private refreshPackageInvestmentsIfNeeded(): void {
    if (this.selectedAgreement?.id &&
        (this.activeTab === 'investor' ||
         (this.isAdmin && this.investmentPackageType === 'CROWDFUNDING') ||
         (this.isInvestorUser && this.investmentPackageType === 'CROWDFUNDING'))) {
      this.loadPackageInvestments(this.selectedAgreement.id);
      if (this.investmentPackageType === 'BIDDING' || this.investmentPackageType === 'CROWDFUNDING') {
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
    // Computed once here (not inline in the template) so the edit modal gets a stable
    // object reference — an inline `asInvestmentPackage(selectedAgreement)` binding would
    // create a new object on every change-detection cycle, re-triggering the wizard's
    // ngOnChanges pre-population and silently discarding whatever the admin just typed.
    this.selectedInvestmentPackageForEdit = this.asInvestmentPackage(lease);
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
        this.refreshCurrentTab(this.selectedAgreement?.id);
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
    this.refreshCurrentTab(this.selectedAgreement?.id);
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

  onViewFollowUpsAction(lease: InvestmentPackageTypeAgreement): void {
    this.onView(lease);
    this.pendingForcedTab = 'follow-up';
    this.activeTab = 'follow-up';
  }

  onCompleteAction(lease: InvestmentPackageTypeAgreement): void {
    this.packageToComplete = {...lease};
    this.completionRemark = '';
    this.showCompleteModal = true;
  }

  handleCompleteConfirmation(): void {
    if (!this.packageToComplete?.id || !this.completionRemark.trim()) return;
    this.completing = true;
    this.investmentPackageService.completeInvestmentPackage(
      this.packageToComplete.id,
      this.completionRemark.trim(),
    ).subscribe({
      next: () => {
        this.completing = false;
        this.showCompleteModal = false;
        this.completionRemark = '';
        this.packageToComplete = null;
        this.toastService.success('Investment package completed successfully');
        this.detailRefreshKey++;
        this.refreshCurrentTab(this.selectedAgreement?.id);
      },
      error: (err) => {
        this.completing = false;
        this.toastService.error(
          err.message || 'Failed to complete investment package',
          'Complete Investment Package',
        );
      },
    });
  }

  onDeactivateAction(lease: InvestmentPackageTypeAgreement): void {
    this.packageToDeactivate = {...lease};
    this.deactivationReason = '';
    this.showDeactivateModal = true;
  }

  handleDeactivateConfirmation(): void {
    if (!this.packageToDeactivate?.id || !this.deactivationReason.trim()) return;
    this.deactivating = true;
    this.investmentPackageService.deactivateInvestmentPackage(
      this.packageToDeactivate.id,
      this.deactivationReason.trim(),
    ).subscribe({
      next: () => {
        this.deactivating = false;
        this.showDeactivateModal = false;
        this.deactivationReason = '';
        this.packageToDeactivate = null;
        this.toastService.success('Investment package deactivated successfully');
        this.detailRefreshKey++;
        this.refreshCurrentTab(this.selectedAgreement?.id);
      },
      error: (err) => {
        this.deactivating = false;
        this.toastService.error(
          err.message || 'Failed to deactivate investment package',
          'Deactivate Investment Package',
        );
      },
    });
  }

  onAgreeOnContractAction(lease: InvestmentPackageTypeAgreement): void {
    this.onView(lease);
    this.pendingForcedTab = 'contract';
    this.activeTab = 'contract';
  }

  onPayAction(lease: InvestmentPackageTypeAgreement): void {
    this.onView(lease);
    this.pendingForcedTab = 'payment';
    this.activeTab = 'payment';
    this.loadPackageInvestments(lease.id);
    this.loadBiddingLeaderboard(lease.id);
  }

  onCandidatesChosen(): void {
    this.detailRefreshKey++;
    this.refreshCurrentTab(this.selectedAgreement?.id);
    if (this.selectedAgreement?.id) {
      this.loadPackageInvestments(this.selectedAgreement.id);
      if (this.investmentPackageType === 'BIDDING') {
        this.loadBiddingLeaderboard(this.selectedAgreement.id);
      }
    }
  }

  onAgreementCreated(): void {
    this.detailRefreshKey++;
    this.refreshCurrentTab(this.selectedAgreement?.id);
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
    if (this.isInvestorUser && this.investmentPackageType !== 'BIDDING') {
      this.investorActiveTab = 'my-leases';
    }
    this.refreshCurrentTab(this.selectedAgreement?.id);
    if (this.selectedAgreement && this.isInvestorUser && this.investmentPackageType === 'BIDDING') {
      this.loadInvestorBidRecord(this.selectedAgreement.id);
    }
  }

  onPackageTypeCreated(): void {
    this.showCreateModal = false;
    this.detailRefreshKey++;
    this.refreshCurrentTab(this.selectedAgreement?.id);
  }

  onPackageTypeUpdated(): void {
    this.showEditModal = false;
    this.detailRefreshKey++;
    this.refreshCurrentTab(this.selectedAgreement?.id);
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
