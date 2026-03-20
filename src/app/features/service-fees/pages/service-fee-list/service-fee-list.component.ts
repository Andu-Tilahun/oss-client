import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {TableQueryParams} from '../../../../shared/data-table/models/table-query-params.model';
import {PageResponse} from '../../../../shared/models/api-response.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {PaymentType, ServiceFee} from '../../models/service-fee.model';
import {ServiceFeeService} from '../../services/service-fee.service';
import {ServiceFeeFilterRequest} from '../service-fee-filter/service-fee-filter-request';

@Component({
  selector: 'app-service-fee-list',
  standalone: false,
  templateUrl: './service-fee-list.component.html',
  styleUrl: './service-fee-list.component.css'
})
export class ServiceFeeListComponent {
  serviceFees: ServiceFee[] = [];
  loading = false;
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  currentPage = 0;

  // Filters
  searchText = '';
  paymentType: PaymentType | '' = '';
  active: '' | 'true' | 'false' = 'true';

  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedServiceFee: ServiceFee | null = null;

  columns: DataTableColumn<ServiceFee>[] = [
    {header: 'Payment Type', value: (f) => this.formatPaymentType(f.paymentType)},
    {header: 'Amount', value: (f) => `${f.amount}`},
    {header: 'Description', value: (f) => f.description || ''},
    {header: 'Active', value: (f) => (f.active ? 'Yes' : 'No')},
    {header: 'End Date', value: (f) => f.endDate ? new Date(f.endDate).toLocaleString() : ''},
  ];

  constructor(
    private serviceFeeService: ServiceFeeService,
    private toastService: ToastService,
    private router: Router
  ) {}

  onView(fee: ServiceFee): void {
    this.router.navigate(['/service-fees', fee.id]);
  }

  ngOnInit() {
    this.loadServiceFees();
  }

  loadServiceFees() {
    this.loading = true;
    const filterRequest: ServiceFeeFilterRequest = this.buildFilterRequest();
    this.serviceFeeService.filterServiceFees(filterRequest).subscribe({
      next: (response: PageResponse<ServiceFee>) => {
        if (response) {
          this.serviceFees = response.content;
          this.total = response.totalElements;
          this.loading = false;
          this.toastService.success(`Service fees retrieved successfully`);
        }
      },
      error: (error) => {
        this.toastService.error(
          error.message || 'Failed to fetch service fees',
          'Fetch Service Fees'
        );
        this.loading = false;
      }
    });
  }

  onPageChange(params: TableQueryParams) {
    this.pageIndex = params.pageIndex;
    this.currentPage = this.pageIndex - 1;
    this.pageSize = params.pageSize;
    this.loadServiceFees();
  }

  onAdd() {
    this.showCreateModal = true;
  }

  onRefresh() {
    this.loadServiceFees();
  }

  onSearch() {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadServiceFees();
  }

  clearFilters() {
    this.searchText = '';
    this.paymentType = '';
    this.active = 'true';
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadServiceFees();
  }

  onEdit(fee: ServiceFee) {
    this.selectedServiceFee = fee;
    this.showEditModal = true;
  }

  onDelete(fee: ServiceFee) {
    this.selectedServiceFee = fee;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.selectedServiceFee) return;

    this.serviceFeeService.deleteServiceFee(this.selectedServiceFee.id).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.selectedServiceFee = null;
        this.loadServiceFees();
      },
      error: (error) => {
        this.toastService.error(
          error.message || 'Failed to delete service fee',
          'Delete Service Fee'
        );
      }
    });
  }

  onServiceFeeCreated() {
    this.loadServiceFees();
  }

  onServiceFeeUpdated() {
    this.loadServiceFees();
  }

  private buildFilterRequest(): ServiceFeeFilterRequest {
    const activeBool = this.active === '' ? undefined : this.active === 'true';

    return {
      searchText: this.searchText || undefined,
      paymentTypes: this.paymentType ? [this.paymentType] : undefined,
      active: activeBool,
      sortBy: 'createdAt',
      sortDirection: 'DESC',
      page: this.currentPage,
      size: this.pageSize
    };
  }

  private formatPaymentType(pt: PaymentType): string {
    return pt
      .split('_')
      .map(w => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');
  }
}

