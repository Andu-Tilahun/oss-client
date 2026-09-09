import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {ColumnType} from '../../../../shared/data-table/models/column-types.model';
import {environment} from '../../../../../environments/environment';
import {TableQueryParams} from '../../../../shared/data-table/models/table-query-params.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {AuthService} from '../../../auth/services/auth.service';
import {
  PageSplitRightAction
} from '../../../../shared/components/page-split-layout/page-split-layout/page-split-right-action.model';
import {InvestmentPackageService} from '../../services/investment-package.service';
import {PageResponse} from '../../../../shared/models/api-response.model';
import {
  InvestmentPackage,
  InvestmentPackageFilterRequest,
  InvestmentPackageType,
} from '../../models/investment-package.model';
import {FundingStatus} from '../../../../shared/models/funding-status.model';
import {TabItem} from '../../../../shared/tabs/models/tab-item.model';
import {packageStatusBadgeClass} from '../../utils/investment-package-status.util';

@Component({
  selector: 'app-investment-package-list',
  standalone: false,
  templateUrl: './investment-package-list.component.html',
  styleUrl: './investment-package-list.component.css',
})
export class InvestmentPackageListComponent implements OnInit {
  publishedPackages: InvestmentPackage[] = [];
  publishedLoading = false;
  publishedTotal = 0;
  publishedPageSize = 10;
  publishedPageIndex = 1;

  archivedPackages: InvestmentPackage[] = [];
  archivedLoading = false;
  archivedTotal = 0;
  archivedPageSize = 10;
  archivedPageIndex = 1;

  selectedInvestmentPackage: InvestmentPackage | null = null;
  detailRefreshKey = 0;

  adminActiveTab = 'published';
  adminTabs: TabItem[] = [
    {key: 'published', label: 'Published Investments'},
    {key: 'archived', label: 'Archived Investments'},
  ];

  searchText = '';
  status: FundingStatus | '' = '';

  showCreateInvestmentPackageModal = false;
  showEditInvestmentPackageModal = false;
  showCreateInvestmentModal = false;
  showDeactivateModal = false;
  deactivating = false;
  deactivateReason = '';
  packageToDeactivate: InvestmentPackage | null = null;

  private readonly storageApiUrl = `${environment.apiUrl}/files`;

  private readonly photoColumn: DataTableColumn<InvestmentPackage> = {
    header: 'Photo',
    columnType: ColumnType.IMAGE,
    value: (c) => c.farmPlot?.imageUuid ? `${this.storageApiUrl}/${c.farmPlot.imageUuid}` : null,
    imageAlt: (c) => c.title,
    defaultVisible: false,
  };

  columns: DataTableColumn<InvestmentPackage>[] = [
    this.photoColumn,
    {header: 'Title', value: (c) => c.title, cellClass: 'block max-w-[200px] truncate'},
    {header: 'Package Status', value: (c) => c.packageStatus ?? 'ACTIVE', cellClass: (c) => packageStatusBadgeClass(c.packageStatus)},
    {header: 'Funding Status', value: (c) => c.fundingStatus, defaultVisible: false},
    {header: 'Type', value: (c) => this.formatPackageType(c.investmentPackageType)},
    {header: 'Deadline', value: (c) => this.formatDeadline(c.fundingDeadline), defaultVisible: false},
    {header: 'Target', value: (c) => this.formatAmount(c.targetAmount)},
    {header: 'Minimum', value: (c) => this.formatAmount(c.minimumContribution)},
  ];

  archivedColumns: DataTableColumn<InvestmentPackage>[] = [
    this.photoColumn,
    {header: 'Title', value: (c) => c.title, cellClass: 'block max-w-[200px] truncate'},
    {header: 'Package Status', value: (c) => c.packageStatus ?? 'ACTIVE', cellClass: (c) => packageStatusBadgeClass(c.packageStatus)},
    {header: 'Type', value: (c) => this.formatPackageType(c.investmentPackageType)},
    {header: 'Funding Status', value: (c) => c.fundingStatus, defaultVisible: false},
    {header: 'Deadline', value: (c) => this.formatDeadline(c.fundingDeadline), defaultVisible: false},
    {header: 'Archived Date', value: (c) => this.formatArchivedDate(c.updatedAt)},
  ];

  tabs: TabItem[] = [
    {key: 'detail', label: 'Detail'},
    {key: 'farm-plot', label: 'FarmPlot'},
    {key: 'investor', label: 'Investor'},
  ];

  rightActions: PageSplitRightAction<InvestmentPackage>[];
  tableRowActions: PageSplitRightAction<InvestmentPackage>[];

  constructor(
    private investmentPackageService: InvestmentPackageService,
    private toastService: ToastService,
    private authService: AuthService,
    private route: ActivatedRoute,
  ) {
    this.rightActions = [
      {
        id: 'invest',
        icon: 'plus',
        title: 'Invest',
        visible: (c) => this.authService.isInvestor() && c.fundingStatus == 'OPEN',
        action: (c) => this.onInvest(c),
      },
    ];
    this.tableRowActions = [
      {
        id: 'edit',
        icon: 'edit',
        title: 'Edit',
        visible: (c) => this.isAdmin
          && c.fundingStatus !== 'CLOSED'
          && c.packageStatus !== 'APPLIED'
          && c.packageStatus !== 'IN_USE'
          && c.packageStatus !== 'INACTIVE'
          && !(c.investorIdList && c.investorIdList.length > 0),
        action: (c) => this.onEdit(c),
      },
      {
        id: 'deactivate',
        icon: 'ban',
        title: 'Deactivate',
        visible: (c) => this.isAdmin
          && c.packageStatus === 'ACTIVE'
          && c.fundingStatus === 'OPEN',
        action: (c) => this.onDeactivate(c),
      },
    ];
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  private formatArchivedDate(value?: string): string {
    if (!value) return '-';
    const d = new Date(value);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', {month: 'short'});
    return `${day}-${month}-${d.getFullYear()}`;
  }

  ngOnInit(): void {
    const queryParams = this.route.snapshot.queryParamMap;
    const deepLinkId = queryParams.get('id');
    if (deepLinkId && queryParams.get('tab') === 'archived') {
      this.adminActiveTab = 'archived';
    }
    this.refreshCurrentTab(deepLinkId);
  }

  onAdminTabChange(key: string): void {
    this.adminActiveTab = key;
    this.refreshCurrentTab();
  }

  onExtensionWorkerAssigned(pkg: InvestmentPackage): void {
    this.selectedInvestmentPackage = pkg;
    this.detailRefreshKey++;
    this.refreshCurrentTab(this.selectedInvestmentPackage?.id);
  }

  /** Monotonic stage progression: Detail/FarmPlot/Investor always show, then Contract once
   *  funding has closed (or a contract already exists), then Extension Worker once the
   *  contract is signed, then FollowUp once a worker is assigned. Structural evidence
   *  (agreementId/extensionWorker existing) always wins over the current fundingStatus/status
   *  label, since a deal can later be force-closed to a terminal status well after it actually
   *  reached a later stage — otherwise archived packages would lose tabs they'd already earned. */
  private computeTabs(): TabItem[] {
    const pkg = this.selectedInvestmentPackage;
    const hasExtensionWorker = !!pkg?.extensionWorker;
    const hasAgreement = !!pkg?.agreementId;
    const contractSigned = hasAgreement && (pkg?.status === 'ACTIVE' || hasExtensionWorker);
    const fundingClosedOrLater =
      pkg?.fundingStatus === 'CLOSED' || pkg?.fundingStatus === 'FUNDED' || hasAgreement;

    const result: TabItem[] = [
      {key: 'detail', label: 'Detail'},
      {key: 'farm-plot', label: 'FarmPlot'},
      {key: 'investor', label: 'Investor'},
    ];

    if (fundingClosedOrLater) {
      result.push({key: 'contract', label: 'Contract'});
    }
    if (contractSigned) {
      result.push({key: 'extension-worker', label: 'Extension Worker', badge: hasExtensionWorker ? undefined : 1});
    }
    if (hasExtensionWorker) {
      const followUpCount = pkg?.followUpDtoList?.length ?? 0;
      result.push({key: 'follow-up', label: 'FollowUp', badge: followUpCount === 0 ? 1 : undefined});
    }
    return result;
  }

  private recomputeTabs(): void {
    this.tabs = this.computeTabs();
  }

  /** Single entry point for every initial load and post-mutation refresh; dispatches to
   *  whichever tab is currently active so the other tab reloads lazily on next visit. */
  refreshCurrentTab(previousId?: string | null): void {
    if (this.adminActiveTab === 'archived') {
      this.loadArchived(previousId);
    } else {
      this.loadPublished(previousId);
    }
  }

  private buildFilterRequest(page: number, size: number): InvestmentPackageFilterRequest {
    return {
      searchText: this.searchText.trim() || undefined,
      statuses: this.status ? [this.status] : undefined,
      sortBy: 'fundingDeadline',
      sortDirection: 'DESC',
      page,
      size,
    };
  }

  loadPublished(previousId?: string | null): void {
    this.publishedLoading = true;
    const request = this.buildFilterRequest(this.publishedPageIndex - 1, this.publishedPageSize);
    this.investmentPackageService.filterPublishedInvestmentPackages(request).subscribe({
      next: (response: PageResponse<InvestmentPackage>) => {
        this.publishedPackages = response.content ?? [];
        this.publishedTotal = response.totalElements ?? this.publishedPackages.length;
        this.publishedLoading = false;
        if (this.adminActiveTab !== 'published') return;
        this.selectFromList(this.publishedPackages, previousId);
        this.recomputeTabs();
      },
      error: (error) => {
        this.publishedLoading = false;
        this.toastService.error(error.message || 'Failed to fetch published investment packages', 'Fetch Investment Packages');
      },
    });
  }

  loadArchived(previousId?: string | null): void {
    this.archivedLoading = true;
    const request = this.buildFilterRequest(this.archivedPageIndex - 1, this.archivedPageSize);
    this.investmentPackageService.filterArchivedInvestmentPackages(request).subscribe({
      next: (response: PageResponse<InvestmentPackage>) => {
        this.archivedPackages = response.content ?? [];
        this.archivedTotal = response.totalElements ?? this.archivedPackages.length;
        this.archivedLoading = false;
        if (this.adminActiveTab !== 'archived') return;
        this.selectFromList(this.archivedPackages, previousId);
        this.recomputeTabs();
      },
      error: (error) => {
        this.archivedLoading = false;
        this.toastService.error(error.message || 'Failed to fetch archived investment packages', 'Fetch Investment Packages');
      },
    });
  }

  private selectFromList(list: InvestmentPackage[], previousId?: string | null): void {
    if (previousId) {
      const match = list.find((c) => c.id === previousId);
      if (match) {
        this.selectedInvestmentPackage = {...match};
        return;
      }
    }
    this.selectedInvestmentPackage = list.length > 0 ? {...list[0]} : null;
    if (this.selectedInvestmentPackage) this.detailRefreshKey++;
  }

  onPublishedPageChange(params: TableQueryParams): void {
    this.publishedPageIndex = params.pageIndex;
    this.publishedPageSize = params.pageSize;
    this.loadPublished();
  }

  onArchivedPageChange(params: TableQueryParams): void {
    this.archivedPageIndex = params.pageIndex;
    this.archivedPageSize = params.pageSize;
    this.loadArchived();
  }

  private resetActiveTabPaging(): void {
    if (this.adminActiveTab === 'archived') {
      this.archivedPageIndex = 1;
    } else {
      this.publishedPageIndex = 1;
    }
  }

  onAdd(): void {
    this.showCreateInvestmentPackageModal = true;
  }

  onRefresh(): void {
    this.refreshCurrentTab(this.selectedInvestmentPackage?.id);
  }

  onSearch(): void {
    this.resetActiveTabPaging();
    this.refreshCurrentTab();
  }

  onFilterChange(): void {
    this.onSearch();
  }

  clearFilters(): void {
    this.searchText = '';
    this.status = '';
    this.resetActiveTabPaging();
    this.refreshCurrentTab();
  }

  onView(c: InvestmentPackage): void {
    this.selectedInvestmentPackage = {...c};
    this.showCreateInvestmentModal = false;
    this.recomputeTabs();
  }

  onEdit(c: InvestmentPackage): void {
    this.selectedInvestmentPackage = {...c};
    this.showEditInvestmentPackageModal = true;
  }

  onInvest(c: InvestmentPackage): void {
    this.selectedInvestmentPackage = {...c};
    this.showCreateInvestmentModal = true;
  }

  onDeactivate(pkg: InvestmentPackage): void {
    this.packageToDeactivate = {...pkg};
    this.deactivateReason = '';
    this.showDeactivateModal = true;
  }

  handleDeactivateConfirmation(): void {
    if (this.deactivating) {
      return; // a request is already in flight (e.g. Enter pressed again)
    }
    if (!this.packageToDeactivate?.id || !this.deactivateReason.trim()) return;
    this.deactivating = true;
    this.investmentPackageService.closeInvestmentPackage(
      this.packageToDeactivate.id,
      this.deactivateReason.trim(),
    ).subscribe({
      next: () => {
        this.deactivating = false;
        this.showDeactivateModal = false;
        this.deactivateReason = '';
        this.packageToDeactivate = null;
        this.toastService.success('Investment package deactivated successfully');
        this.detailRefreshKey++;
        this.refreshCurrentTab(this.selectedInvestmentPackage?.id);
      },
      error: (err) => {
        this.deactivating = false;
        this.toastService.error(err.message || 'Failed to deactivate investment package', 'Deactivate');
      },
    });
  }

  onInvestmentPackageCreated(): void {
    this.showCreateInvestmentPackageModal = false;
    this.detailRefreshKey++;
    this.refreshCurrentTab(this.selectedInvestmentPackage?.id);
  }

  onInvestmentPackageUpdated(): void {
    this.showEditInvestmentPackageModal = false;
    this.detailRefreshKey++;
    this.refreshCurrentTab(this.selectedInvestmentPackage?.id);
  }

  onInvestmentPackageCompleted(): void {
    this.detailRefreshKey++;
    this.refreshCurrentTab(this.selectedInvestmentPackage?.id);
  }

  onCandidatesChosen(): void {
    this.detailRefreshKey++;
    this.refreshCurrentTab(this.selectedInvestmentPackage?.id);
  }

  onAgreementCreated(): void {
    this.detailRefreshKey++;
    this.refreshCurrentTab(this.selectedInvestmentPackage?.id);
  }

  onInvestmentCreated(): void {
    this.showCreateInvestmentModal = false;
    this.toastService.success('Investment registered successfully');
  }

  private formatPackageType(value: InvestmentPackageType | undefined): string {
    return value ?? '-';
  }

  private formatDeadline(value: string | undefined): string {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private formatAmount(value: number | undefined): string {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(
      value,
    );
  }
}
