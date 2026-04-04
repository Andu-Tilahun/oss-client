import {Component, OnInit} from '@angular/core';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {TableQueryParams} from '../../../../shared/data-table/models/table-query-params.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {AuthService} from '../../../auth/services/auth.service';
import {PageSplitRightAction} from '../../../../shared/components/page-split-layout/page-split-layout/page-split-right-action.model';
import {CrowdFundingService} from '../../services/crowd-funding.service';
import {
  InvestmentApprovalStatus,
  InvestmentFilterRequest,
  InvestmentRecord,
  InvestmentStatus,
} from '../../models/crowd-funding.model';
import {PageResponse} from '../../../../shared/models/api-response.model';

@Component({
  selector: 'app-farm-crowdfunding-investment-list',
  standalone: false,
  templateUrl: './farm-crowdfunding-investment-list.component.html',
  styleUrl: './farm-crowdfunding-investment-list.component.css',
})
export class FarmCrowdfundingInvestmentListComponent implements OnInit {
  investments: InvestmentRecord[] = [];
  selectedInvestment: InvestmentRecord | null = null;
  detailRefreshKey = 0;

  loading = false;
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  currentPage = 0;

  searchText = '';
  status: InvestmentStatus | '' = '';
  approval: InvestmentApprovalStatus | '' = '';

  showSetRoiModal = false;
  showInvestorDecisionModal = false;

  private isAdmin = false;

  columns: DataTableColumn<InvestmentRecord>[] = [
    {header: 'Amount', value: (r) => this.formatAmount(r.amount)},
    {header: 'Method', value: (r) => r.paymentMethod},
    {header: 'Status', value: (r) => r.status},
    {header: 'Approval', value: (r) => r.approvalStatus},
  ];

  rightActions: PageSplitRightAction<InvestmentRecord>[];

  constructor(
    private crowdfundingService: CrowdFundingService,
    private toastService: ToastService,
    private authService: AuthService,
  ) {
    const role = (this.authService.getCurrentUser()?.role ?? '').toString().trim().toUpperCase();
    this.isAdmin = role === 'ADMIN';

    this.rightActions = [
      {
        id: 'set-roi',
        icon: 'edit',
        title: 'Set ROI',
        visible: (r) => this.shouldShowSetRoi(r),
        action: (r) => this.onSetRoi(r),
      },
      {
        id: 'decide',
        icon: 'check',
        title: 'Approve / Reject',
        visible: (r) => this.shouldShowInvestorDecision(r),
        action: (r) => this.onInvestorDecision(r),
      },
    ];
  }

  ngOnInit(): void {
    // Admin default: show items needing ROI/decision
    if (this.isAdmin && !this.approval) {
      this.approval = 'PENDING';
    }
    if (!this.isAdmin && !this.approval) {
      this.approval = 'PENDING';
    }
    this.loadInvestments();
  }

  get isAdminUser(): boolean {
    return this.isAdmin;
  }

  private normalize(v: unknown): string {
    return (v ?? '').toString().trim().toUpperCase();
  }

  private shouldShowSetRoi(r: InvestmentRecord | null | undefined): boolean {
    if (!r) return false;
    if (!this.isAdmin) return false;
    return !r.roi || this.normalize(r.approvalStatus) === 'PENDING';
  }

  private shouldShowInvestorDecision(r: InvestmentRecord | null | undefined): boolean {
    if (!r) return false;
    if (this.isAdmin) return false;
    return !!r.roi && this.normalize(r.approvalStatus) === 'PENDING';
  }

  private buildFilterRequest(): InvestmentFilterRequest {
    return {
      searchText: this.searchText || undefined,
      statuses: this.status ? [this.status] : undefined,
      approvalStatuses: this.approval ? [this.approval] : undefined,
      sortBy: 'createdAt',
      sortDirection: 'DESC',
      page: this.currentPage,
      size: this.pageSize,
    };
  }

  loadInvestments(): void {
    this.loading = true;
    const request = this.buildFilterRequest();
    this.crowdfundingService.filterInvestments(request).subscribe({
      next: (response: PageResponse<InvestmentRecord>) => {
        this.investments = response.content;
        this.total = response.totalElements;
        this.loading = false;

        const previousSelectedId = this.selectedInvestment?.id;
        if (this.investments.length === 0) {
          this.selectedInvestment = null;
          return;
        }
        if (!previousSelectedId) {
          this.selectedInvestment = {...this.investments[0]};
          this.detailRefreshKey++;
          return;
        }
        const match = this.investments.find((r) => r.id === previousSelectedId);
        if (match) {
          this.selectedInvestment = {...match};
          return;
        }
        this.selectedInvestment = {...this.investments[0]};
        this.detailRefreshKey++;
      },
      error: (error) => {
        this.loading = false;
        this.toastService.error(error.message || 'Failed to fetch investments', 'Fetch Investments');
      },
    });
  }

  onPageChange(params: TableQueryParams) {
    this.pageIndex = params.pageIndex;
    this.currentPage = this.pageIndex - 1;
    this.pageSize = params.pageSize;
    this.loadInvestments();
  }

  onRefresh(): void {
    this.loadInvestments();
  }

  onSearch(): void {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadInvestments();
  }

  onFilterChange(): void {
    this.onSearch();
  }

  clearFilters(): void {
    this.searchText = '';
    this.status = '';
    this.approval = 'PENDING';
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadInvestments();
  }

  onView(r: InvestmentRecord): void {
    this.selectedInvestment = {...r};
    this.showSetRoiModal = false;
    this.showInvestorDecisionModal = false;
  }

  onSetRoi(r: InvestmentRecord): void {
    this.selectedInvestment = {...r};
    this.showSetRoiModal = true;
  }

  onInvestorDecision(r: InvestmentRecord): void {
    this.selectedInvestment = {...r};
    this.showInvestorDecisionModal = true;
  }

  onRoiSaved(): void {
    this.showSetRoiModal = false;
    this.detailRefreshKey++;
    this.loadInvestments();
  }

  onDecisionSaved(): void {
    this.showInvestorDecisionModal = false;
    this.detailRefreshKey++;
    this.loadInvestments();
  }

  private formatAmount(value: number | undefined): string {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(
      value,
    );
  }
}

