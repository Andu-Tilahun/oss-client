import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { PaymentDetail } from '../../models/payment.model';
import { DataTableColumn } from '../../../../shared/data-table/models/data-table-column.model';
import { TableQueryParams } from '../../../../shared/data-table/models/table-query-params.model';
import { PageResponse } from '../../../../shared/models/api-response.model';
import { ToastService } from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-payment-list',
  standalone: false,
  templateUrl: './payment-list.component.html'
})
export class PaymentListComponent implements OnInit {
  payments: PaymentDetail[] = [];
  loading = false;
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  status = '';

  columns: DataTableColumn<PaymentDetail>[] = [
    { header: 'Order Number', value: p => p.orderNumber },
    { header: 'Utility', value: p => p.utility },
    { header: 'Full Name', value: p => p.fullName },
    { header: 'Amount', value: p => String(p.amount) },
    { header: 'Status', value: p => p.paymentDetailStatus },
    { header: 'Due Date', value: p => p.dueDate ? new Date(p.dueDate).toLocaleString() : '-' },
    { header: 'Created At', value: p => p.createdAt ? new Date(p.createdAt).toLocaleString() : '-' }
  ];

  constructor(
    private paymentService: PaymentService,
    private toastService: ToastService,
    private router: Router
  ) {}

  onView(payment: PaymentDetail): void {
    this.router.navigate(['/payments', payment.id]);
  }

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading = true;
    this.paymentService.getPayments(
      this.pageIndex - 1,
      this.pageSize,
      this.status || undefined
    ).subscribe({
      next: (response: PageResponse<PaymentDetail>) => {
        if (response) {
          this.toastService.success('Payments retrieved successfully');
          this.payments = response.content || [];
          this.total = response.totalElements ?? 0;
        }
        this.loading = false;
      },
      error: (error) => {
        this.toastService.error(
          error?.message || 'Failed to fetch payments',
          'Fetch Payments'
        );
        this.loading = false;
      }
    });
  }

  onPageChange(params: TableQueryParams): void {
    this.pageIndex = params.pageIndex;
    this.pageSize = params.pageSize;
    this.loadPayments();
  }

  onSearch(): void {
    this.pageIndex = 1;
    this.loadPayments();
  }

  clearFilters(): void {
    this.status = '';
    this.pageIndex = 1;
    this.loadPayments();
  }
}
