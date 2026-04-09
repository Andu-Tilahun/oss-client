import {Component, OnInit} from '@angular/core';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {TableQueryParams} from '../../../../shared/data-table/models/table-query-params.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {AuthService} from '../../../auth/services/auth.service';
import {
  PageSplitRightAction
} from '../../../../shared/components/page-split-layout/page-split-layout/page-split-right-action.model';
import {CrowdFundingService} from '../../services/crowd-funding.service';
import {ApiResponse, PageResponse} from '../../../../shared/models/api-response.model';
import {CrowdFunding, CrowdFundingFilterRequest, FundingStatus} from "../../models/crowd-funding.model";
import {TabItem} from "../../../../shared/tabs/models/tab-item.model";
import {LeaseAgreement} from "../../../farm-leases/models/farm-lease.model";
import {AssignExtensionWorkerRequest} from "../../../assign-extension-worker-request";

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

  assignExtensionWorkerRequest = {} as AssignExtensionWorkerRequest;

  loading = false;
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  currentPage = 0;

  searchText = '';
  status: FundingStatus | '' = '';

  showCreatecrowdFundingModal = false;
  showEditcrowdFundingModal = false;
  showCreateInvestmentModal = false;
  showAssignExtenstionWorkerModal = false;

  columns: DataTableColumn<CrowdFunding>[] = [
    {header: 'Title', value: (c) => c.title},
    {header: 'Status', value: (c) => c.fundingStatus},
    {header: 'Deadline', value: (c) => c.fundingDeadline},
    {header: 'Target', value: (c) => this.formatAmount(c.targetAmount)},
    {header: 'Minimum', value: (c) => this.formatAmount(c.minimumContribution)},
  ];

  activeTab = 'detail';

  tabs: TabItem[] = [
    {key: 'detail', label: 'Detail'},
    {key: 'farm-plot', label: 'FarmPlot'},
    {key: 'follow-up', label: 'FollowUp'},
  ];

  rightActions: PageSplitRightAction<CrowdFunding>[];

  constructor(
    private crowdfundingService: CrowdFundingService,
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
      {
        id: 'assign',
        icon: 'assign',
        title: 'Assign Extension Worker',
        visible: (r) => this.authService.isAdmin() && r.fundingStatus == "OPEN" && !r.extensionWorker,
        action: (r) => this.onAssignExtensionWorker(r),
      },
    ];
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    if (!this.authService.isInvestor()) {
      this.status = 'OPEN';
    }
    this.loadCrowdFundings();
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

  loadCrowdFundings(): void {
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
    this.loadCrowdFundings();
  }

  onAdd(): void {
    // Admin creates Operation + crowdFunding
    this.showCreatecrowdFundingModal = true;
  }

  onRefresh(): void {
    this.loadCrowdFundings();
  }

  onSearch(): void {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadCrowdFundings();
  }

  onFilterChange(): void {
    this.onSearch();
  }

  clearFilters(): void {
    this.searchText = '';
    this.status = '';
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadCrowdFundings();
  }

  onView(c: CrowdFunding): void {
    this.selectedcrowdFunding = {...c};
    this.showCreateInvestmentModal = false;
  }

  onEdit(c: CrowdFunding): void {
    this.selectedcrowdFunding = {...c};
    this.showEditcrowdFundingModal = true;
  }

  onInvest(c: CrowdFunding): void {
    this.selectedcrowdFunding = {...c};
    this.showCreateInvestmentModal = true;
  }

  onCrowdFundingCreated(): void {
    this.showCreatecrowdFundingModal = false;
    this.detailRefreshKey++;
    this.loadCrowdFundings();
  }

  onCrowdFundingUpdated(): void {
    this.showEditcrowdFundingModal = false;
    this.detailRefreshKey++;
    this.loadCrowdFundings();
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

  private onAssignExtensionWorker(r: CrowdFunding) {
    this.showAssignExtenstionWorkerModal = true;
  }

  onSelectedUser(id: any) {
    this.assignExtensionWorkerRequest.externalId = this.selectedcrowdFunding!.id;
    this.assignExtensionWorkerRequest.extensionWorkerId = id;
  }

  onConfirm($event: void) {
    this.crowdfundingService.assignExtensionWorker(this.assignExtensionWorkerRequest).subscribe({
      next: (res: ApiResponse<CrowdFunding>) => {
        this.selectedcrowdFunding = res?.data ?? null;
        this.loading = false;
        this.toastService.success('Extension Worker Assigned successfully');
      },
      error: () => {
        this.toastService.error('Failed to assign Extension Worker');
        this.loading = false;
      },
    });
  }
}

