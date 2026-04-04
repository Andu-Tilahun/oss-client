import {Component, OnInit} from '@angular/core';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {TableQueryParams} from '../../../../shared/data-table/models/table-query-params.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {AuthService} from '../../../auth/services/auth.service';
import {
  PageSplitRightAction
} from '../../../../shared/components/page-split-layout/page-split-layout/page-split-right-action.model';
import {CrowdFundingService} from '../../services/crowd-funding.service';
import {PageResponse} from '../../../../shared/models/api-response.model';
import {CrowdFunding, CrowdFundingFilterRequest, FundingStatus} from "../../models/crowd-funding.model";

@Component({
  selector: 'app-farm-crowdfunding-crowdFunding-list',
  standalone: false,
  templateUrl: './crowd-funding-list.component.html',
  styleUrl: './crowd-funding-list.component.css',
})
export class CrowdFundingListComponent implements OnInit {
  crowdFundings: CrowdFunding[] = [];
  selectedcrowdFunding: CrowdFunding | null = null;
  detailRefreshKey = 0;

  loading = false;
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  currentPage = 0;

  searchText = '';
  status: FundingStatus | '' = '';

  showCreatecrowdFundingModal = false;
  showCreateInvestmentModal = false;

  private isAdmin = false;

  columns: DataTableColumn<CrowdFunding>[] = [
    {header: 'Title', value: (c) => c.title},
    {header: 'Status', value: (c) => c.fundingStatus},
    {header: 'Deadline', value: (c) => c.fundingDeadline},
    {header: 'Target', value: (c) => this.formatAmount(c.targetAmount)},
    {header: 'Minimum', value: (c) => this.formatAmount(c.minimumContribution)},
  ];

  rightActions: PageSplitRightAction<CrowdFunding>[];

  constructor(
    private crowdfundingService: CrowdFundingService,
    private toastService: ToastService,
    private authService: AuthService,
  ) {
    const role = (this.authService.getCurrentUser()?.role ?? '').toString().trim().toUpperCase();
    this.isAdmin = role === 'ADMIN';

    this.rightActions = [
      {
        id: 'invest',
        icon: 'plus',
        title: 'Invest',
        visible: (c) => this.shouldShowInvestAction(c),
        action: (c) => this.onInvest(c),
      },
    ];
  }

  ngOnInit(): void {
    // Investor default: only OPEN crowdFundings. Admin can see all.
    if (!this.isAdmin && !this.status) {
      this.status = 'OPEN';
    }
    this.loadcrowdFundings();
  }

  get isAdminUser(): boolean {
    return this.isAdmin;
  }

  private shouldShowInvestAction(c: CrowdFunding | null | undefined): boolean {
    if (!c) return false;
    if (this.isAdmin) return false;
    return (c.fundingStatus ?? '').toString().trim().toUpperCase() === 'OPEN';
  }

  private buildFilterRequest(): CrowdFundingFilterRequest {
    return {
      searchText: this.searchText || undefined,
      statuses: this.status ? [this.status] : undefined,
      sortBy: 'fundingDeadline',
      sortDirection: 'DESC',
      page: this.currentPage,
      size: this.pageSize,
    };
  }

  loadcrowdFundings(): void {
    this.loading = true;
    const request = this.buildFilterRequest();
    this.crowdfundingService.filterCrowdFunding(request).subscribe({
      next: (response: PageResponse<CrowdFunding>) => {
        this.crowdFundings = response.content;
        this.total = response.totalElements;
        this.loading = false;

        const previousSelectedId = this.selectedcrowdFunding?.id;
        if (this.crowdFundings.length === 0) {
          this.selectedcrowdFunding = null;
          return;
        }
        if (!previousSelectedId) {
          this.selectedcrowdFunding = {...this.crowdFundings[0]};
          this.detailRefreshKey++;
          return;
        }
        const match = this.crowdFundings.find((c) => c.id === previousSelectedId);
        if (match) {
          this.selectedcrowdFunding = {...match};
          return;
        }
        this.selectedcrowdFunding = {...this.crowdFundings[0]};
        this.detailRefreshKey++;
      },
      error: (error) => {
        this.loading = false;
        this.toastService.error(error.message || 'Failed to fetch crowdFundings', 'Fetch crowdFundings');
      },
    });
  }

  onPageChange(params: TableQueryParams) {
    this.pageIndex = params.pageIndex;
    this.currentPage = this.pageIndex - 1;
    this.pageSize = params.pageSize;
    this.loadcrowdFundings();
  }

  onAdd(): void {
    // Admin creates Operation + crowdFunding
    this.showCreatecrowdFundingModal = true;
  }

  onRefresh(): void {
    this.loadcrowdFundings();
  }

  onSearch(): void {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadcrowdFundings();
  }

  onFilterChange(): void {
    this.onSearch();
  }

  clearFilters(): void {
    this.searchText = '';
    this.status = '';
    this.currentPage = 0;
    this.pageIndex = 1;
    if (!this.isAdmin) {
      this.status = 'OPEN';
    }
    this.loadcrowdFundings();
  }

  onView(c: CrowdFunding): void {
    this.selectedcrowdFunding = {...c};
    this.showCreateInvestmentModal = false;
  }

  onInvest(c: CrowdFunding): void {
    this.selectedcrowdFunding = {...c};
    this.showCreateInvestmentModal = true;
  }

  oncrowdFundingCreated(): void {
    this.showCreatecrowdFundingModal = false;
    this.detailRefreshKey++;
    this.loadcrowdFundings();
  }

  onInvestmentCreated(): void {
    this.showCreateInvestmentModal = false;
    this.toastService.success('Investment registered successfully');
  }

  private formatAmount(value: number | undefined): string {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(
      value,
    );
  }
}

