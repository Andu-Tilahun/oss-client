import {Component, OnInit} from '@angular/core';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
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
import {FundingStatus, FUNDING_STATUSES} from '../../../../shared/models/funding-status.model';
import {TabItem} from '../../../../shared/tabs/models/tab-item.model';

@Component({
  selector: 'app-investment-package-list',
  standalone: false,
  templateUrl: './investment-package-list.component.html',
  styleUrl: './investment-package-list.component.css',
})
export class InvestmentPackageListComponent implements OnInit {
  investmentPackages: InvestmentPackage[] = [];
  publishedPackages: InvestmentPackage[] = [];
  archivedPackages: InvestmentPackage[] = [];
  selectedInvestmentPackage: InvestmentPackage | null = null;
  detailRefreshKey = 0;

  loading = false;

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

  columns: DataTableColumn<InvestmentPackage>[] = [
    {header: 'Title', value: (c) => c.title, cellClass: 'block max-w-[200px] truncate'},
    {header: 'Package Status', value: (c) => c.packageStatus ?? 'ACTIVE'},
    {header: 'Funding Status', value: (c) => c.fundingStatus, defaultVisible: false},
    {header: 'Type', value: (c) => this.formatPackageType(c.investmentPackageType)},
    {header: 'Deadline', value: (c) => this.formatDeadline(c.fundingDeadline), defaultVisible: false},
    {header: 'Target', value: (c) => this.formatAmount(c.targetAmount)},
    {header: 'Minimum', value: (c) => this.formatAmount(c.minimumContribution)},
  ];

  tabs: TabItem[] = [
    {key: 'detail', label: 'Detail'},
    {key: 'farm-plot', label: 'FarmPlot'},
    {key: 'extension-worker', label: 'Extension Worker'},
    {key: 'follow-up', label: 'FollowUp'},
  ];

  rightActions: PageSplitRightAction<InvestmentPackage>[];
  tableRowActions: PageSplitRightAction<InvestmentPackage>[];

  constructor(
    private investmentPackageService: InvestmentPackageService,
    private toastService: ToastService,
    private authService: AuthService,
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

  ngOnInit(): void {
    this.loadInvestmentPackages();
  }

  onAdminTabChange(key: string): void {
    this.adminActiveTab = key;
    const packages = key === 'archived' ? this.archivedPackages : this.publishedPackages;
    this.selectedInvestmentPackage = packages.length > 0 ? {...packages[0]} : null;
    if (this.selectedInvestmentPackage) this.detailRefreshKey++;
  }

  onExtensionWorkerAssigned(pkg: InvestmentPackage): void {
    this.selectedInvestmentPackage = pkg;
    this.detailRefreshKey++;
  }

  private buildFilterRequest(): InvestmentPackageFilterRequest {
    return {
      searchText: this.searchText || undefined,
      statuses: this.status ? [this.status] : FUNDING_STATUSES,
      sortBy: 'fundingDeadline',
      sortDirection: 'DESC',
      page: 0,
      size: 500,
    };
  }

  loadInvestmentPackages(): void {
    this.loading = true;
    const request = this.buildFilterRequest();
    this.investmentPackageService.filterInvestmentPackages(request).subscribe({
      next: (response: PageResponse<InvestmentPackage>) => {
        this.investmentPackages = response.content;
        this.publishedPackages = this.investmentPackages.filter((c) => c.packageStatus !== 'INACTIVE');
        this.archivedPackages = this.investmentPackages.filter((c) => c.packageStatus === 'INACTIVE');
        this.loading = false;

        const activeList = this.adminActiveTab === 'archived' ? this.archivedPackages : this.publishedPackages;
        const previousSelectedId = this.selectedInvestmentPackage?.id;
        if (previousSelectedId) {
          const match = this.investmentPackages.find((c) => c.id === previousSelectedId);
          if (match) {
            this.selectedInvestmentPackage = {...match};
            return;
          }
        }
        this.selectedInvestmentPackage = activeList.length > 0 ? {...activeList[0]} : null;
        if (this.selectedInvestmentPackage) this.detailRefreshKey++;
      },
      error: (error) => {
        this.loading = false;
        this.toastService.error(error.message || 'Failed to fetch investment packages', 'Fetch Investment Packages');
      },
    });
  }

  onAdd(): void {
    this.showCreateInvestmentPackageModal = true;
  }

  onRefresh(): void {
    this.loadInvestmentPackages();
  }

  onSearch(): void {
    this.loadInvestmentPackages();
  }

  onFilterChange(): void {
    this.loadInvestmentPackages();
  }

  clearFilters(): void {
    this.searchText = '';
    this.status = '';
    this.loadInvestmentPackages();
  }

  onView(c: InvestmentPackage): void {
    this.selectedInvestmentPackage = {...c};
    this.showCreateInvestmentModal = false;
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
        this.loadInvestmentPackages();
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
    this.loadInvestmentPackages();
  }

  onInvestmentPackageUpdated(): void {
    this.showEditInvestmentPackageModal = false;
    this.detailRefreshKey++;
    this.loadInvestmentPackages();
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
