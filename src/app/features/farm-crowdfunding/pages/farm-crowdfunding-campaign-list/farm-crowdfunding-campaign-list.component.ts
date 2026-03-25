import {Component, OnInit} from '@angular/core';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {TableQueryParams} from '../../../../shared/data-table/models/table-query-params.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {AuthService} from '../../../auth/services/auth.service';
import {PageSplitRightAction} from '../../../../shared/components/page-split-layout/page-split-layout/page-split-right-action.model';
import {FarmCrowdfundingService} from '../../services/farm-crowdfunding.service';
import {
  CrowdfundingCampaign,
  CrowdfundingCampaignFilterRequest,
  FundingStatus,
} from '../../models/farm-crowdfunding.model';
import {PageResponse} from '../../../../shared/models/api-response.model';

@Component({
  selector: 'app-farm-crowdfunding-campaign-list',
  standalone: false,
  templateUrl: './farm-crowdfunding-campaign-list.component.html',
  styleUrl: './farm-crowdfunding-campaign-list.component.css',
})
export class FarmCrowdfundingCampaignListComponent implements OnInit {
  campaigns: CrowdfundingCampaign[] = [];
  selectedCampaign: CrowdfundingCampaign | null = null;
  detailRefreshKey = 0;

  loading = false;
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  currentPage = 0;

  searchText = '';
  status: FundingStatus | '' = '';

  showCreateCampaignModal = false;
  showCreateInvestmentModal = false;

  private isAdmin = false;

  columns: DataTableColumn<CrowdfundingCampaign>[] = [
    {header: 'Title', value: (c) => c.title},
    {header: 'Status', value: (c) => c.fundingStatus},
    {header: 'Deadline', value: (c) => c.fundingDeadline},
    {header: 'Target', value: (c) => this.formatAmount(c.targetAmount)},
    {header: 'Minimum', value: (c) => this.formatAmount(c.minimumContribution)},
  ];

  rightActions: PageSplitRightAction<CrowdfundingCampaign>[];

  constructor(
    private crowdfundingService: FarmCrowdfundingService,
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
    // Investor default: only OPEN campaigns. Admin can see all.
    if (!this.isAdmin && !this.status) {
      this.status = 'OPEN';
    }
    this.loadCampaigns();
  }

  get isAdminUser(): boolean {
    return this.isAdmin;
  }

  private shouldShowInvestAction(c: CrowdfundingCampaign | null | undefined): boolean {
    if (!c) return false;
    if (this.isAdmin) return false;
    return (c.fundingStatus ?? '').toString().trim().toUpperCase() === 'OPEN';
  }

  private buildFilterRequest(): CrowdfundingCampaignFilterRequest {
    return {
      searchText: this.searchText || undefined,
      statuses: this.status ? [this.status] : undefined,
      sortBy: 'fundingDeadline',
      sortDirection: 'DESC',
      page: this.currentPage,
      size: this.pageSize,
    };
  }

  loadCampaigns(): void {
    this.loading = true;
    const request = this.buildFilterRequest();
    this.crowdfundingService.filterCampaigns(request).subscribe({
      next: (response: PageResponse<CrowdfundingCampaign>) => {
        this.campaigns = response.content;
        this.total = response.totalElements;
        this.loading = false;

        const previousSelectedId = this.selectedCampaign?.id;
        if (this.campaigns.length === 0) {
          this.selectedCampaign = null;
          return;
        }
        if (!previousSelectedId) {
          this.selectedCampaign = {...this.campaigns[0]};
          this.detailRefreshKey++;
          return;
        }
        const match = this.campaigns.find((c) => c.id === previousSelectedId);
        if (match) {
          this.selectedCampaign = {...match};
          return;
        }
        this.selectedCampaign = {...this.campaigns[0]};
        this.detailRefreshKey++;
      },
      error: (error) => {
        this.loading = false;
        this.toastService.error(error.message || 'Failed to fetch campaigns', 'Fetch Campaigns');
      },
    });
  }

  onPageChange(params: TableQueryParams) {
    this.pageIndex = params.pageIndex;
    this.currentPage = this.pageIndex - 1;
    this.pageSize = params.pageSize;
    this.loadCampaigns();
  }

  onAdd(): void {
    // Admin creates Operation + Campaign
    this.showCreateCampaignModal = true;
  }

  onRefresh(): void {
    this.loadCampaigns();
  }

  onSearch(): void {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadCampaigns();
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
    this.loadCampaigns();
  }

  onView(c: CrowdfundingCampaign): void {
    this.selectedCampaign = {...c};
    this.showCreateInvestmentModal = false;
  }

  onInvest(c: CrowdfundingCampaign): void {
    this.selectedCampaign = {...c};
    this.showCreateInvestmentModal = true;
  }

  onCampaignCreated(): void {
    this.showCreateCampaignModal = false;
    this.detailRefreshKey++;
    this.loadCampaigns();
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

