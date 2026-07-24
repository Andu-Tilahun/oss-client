import {Component, OnInit} from '@angular/core';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
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
  selectedInvestmentPackage: InvestmentPackage | null = null;
  detailRefreshKey = 0;

  loading = false;
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  currentPage = 0;

  searchText = '';
  status: FundingStatus | '' = '';

  showCreateInvestmentPackageModal = false;
  showEditInvestmentPackageModal = false;
  showCreateInvestmentModal = false;

  columns: DataTableColumn<InvestmentPackage>[] = [
    {header: 'Title', value: (c) => c.title},
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
        visible: (c) => this.isAdmin && c.fundingStatus !== 'CLOSED' && c.packageStatus !== 'IN_USE' && c.packageStatus !== 'INACTIVE',
        action: (c) => this.onEdit(c),
      },
      {
        id: 'toggle-status',
        icon: 'power',
        title: 'Toggle Status',
        visible: (c) => this.isAdmin && c.packageStatus !== 'IN_USE',
        action: (c) => this.onToggleStatus(c),
      },
    ];
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.loadInvestmentPackages();
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
      page: this.currentPage,
      size: this.pageSize,
    };
  }

  loadInvestmentPackages(): void {
    this.loading = true;
    const request = this.buildFilterRequest();
    this.investmentPackageService.filterInvestmentPackages(request).subscribe({
      next: (response: PageResponse<InvestmentPackage>) => {
        this.investmentPackages = response.content;
        this.total = response.totalElements;
        this.loading = false;

        const previousSelectedId = this.selectedInvestmentPackage?.id;
        if (this.investmentPackages.length === 0) {
          this.selectedInvestmentPackage = null;
          return;
        }
        if (!previousSelectedId) {
          this.selectedInvestmentPackage = {...this.investmentPackages[0]};
          this.detailRefreshKey++;
          return;
        }
        const match = this.investmentPackages.find((c) => c.id === previousSelectedId);
        if (match) {
          this.selectedInvestmentPackage = {...match};
          return;
        }
        this.selectedInvestmentPackage = {...this.investmentPackages[0]};
        this.detailRefreshKey++;
      },
      error: (error) => {
        this.loading = false;
        this.toastService.error(error.message || 'Failed to fetch investment packages', 'Fetch Investment Packages');
      },
    });
  }

  onPageChange(params: TableQueryParams) {
    this.pageIndex = params.pageIndex;
    this.currentPage = this.pageIndex - 1;
    this.pageSize = params.pageSize;
    this.loadInvestmentPackages();
  }

  onAdd(): void {
    this.showCreateInvestmentPackageModal = true;
  }

  onRefresh(): void {
    this.loadInvestmentPackages();
  }

  onSearch(): void {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadInvestmentPackages();
  }

  onFilterChange(): void {
    this.onSearch();
  }

  clearFilters(): void {
    this.searchText = '';
    this.status = '';
    this.currentPage = 0;
    this.pageIndex = 1;
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

  onToggleStatus(pkg: InvestmentPackage): void {
    this.investmentPackageService.togglePackageStatus(pkg.id).subscribe({
      next: () => this.loadInvestmentPackages(),
      error: (err) => this.toastService.error(err.message || 'Failed to update status', 'Status Update'),
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
