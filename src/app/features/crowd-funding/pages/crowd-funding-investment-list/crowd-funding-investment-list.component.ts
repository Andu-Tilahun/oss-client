import {Component, OnInit} from '@angular/core';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {TableQueryParams} from '../../../../shared/data-table/models/table-query-params.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {AuthService} from '../../../auth/services/auth.service';
import {
  PageSplitRightAction
} from '../../../../shared/components/page-split-layout/page-split-layout/page-split-right-action.model';
import {CrowdFundingService} from '../../services/crowd-funding.service';
import {InvestmentFilterRequest, InvestmentRecord, InvestmentStatus,} from '../../models/crowd-funding.model';
import {PageResponse} from '../../../../shared/models/api-response.model';

@Component({
  selector: 'app-crowd-funding-investment-list',
  standalone: false,
  templateUrl: './crowd-funding-investment-list.component.html',
  styleUrl: './crowd-funding-investment-list.component.css',
})
export class CrowdFundingInvestmentListComponent implements OnInit {
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

  showSetRoiModal = false;
  showInvestorDecisionModal = false;
  lockSend = false;
  showConfirmationModal = false;

  columns: DataTableColumn<InvestmentRecord>[] = [
    {header: 'Amount', value: (r) => this.formatAmount(r.amount)},
    {header: 'Method', value: (r) => r.paymentMethod},
    {header: 'Status', value: (r) => r.status},
  ];

  rightActions: PageSplitRightAction<InvestmentRecord>[];

  constructor(
    private crowdfundingService: CrowdFundingService,
    private toastService: ToastService,
    private authService: AuthService,
  ) {


    this.rightActions = [
      {
        id: 'sent',
        icon: 'send',
        title: 'Send',
        visible: (r) => this.authService.isInvestor() && r.status == "PENDING",
        action: (r) => this.onSend(r),
      },

      {
        id: 'download',
        icon: 'download',
        title: 'Download',
        visible: (r) => this.authService.isInvestor() && r.status == "ACCEPTED",
        action: (r) => this.onDownload(r),
      },
      {
        id: 'decide',
        icon: 'check',
        title: 'Accept / Reject',
        visible: (r) => this.authService.isAdmin() && r.status == "ACCEPTED",
        action: (r) => this.onInvestorDecision(r),
      },
    ];
  }

  ngOnInit(): void {
    this.loadInvestments();
  }

  private buildFilterRequest(): InvestmentFilterRequest {
    return {
      searchText: this.searchText || undefined,
      sortBy: 'createdDate',
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

  onSend(r: InvestmentRecord): void {
    this.selectedInvestment = {...r};
    this.showConfirmationModal = true;
    this.lockSend = false;
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

  handleSendConfirmation() {
    if (!this.selectedInvestment) return;

    this.lockSend = true;

    this.crowdfundingService.send(this.selectedInvestment.id).subscribe({
      next: () => {
        this.lockSend = false;
        this.showConfirmationModal = false;
        this.toastService.success(`Investment sent successfully`);

        this.loadInvestments();
      },
      error: (error) => {
        this.lockSend = false;
        this.toastService.error(
          error.message || 'Failed to send Investment',
          'Send Investment'
        );
      }
    });

  }

  private onDownload(r: InvestmentRecord) {

  }

  private onAssignExtensionWorker(r: InvestmentRecord) {

  }
}

