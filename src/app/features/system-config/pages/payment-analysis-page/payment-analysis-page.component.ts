import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../../payments/services/payment.service';
import { PaymentDetail } from '../../../payments/models/payment.model';

@Component({
  selector: 'app-payment-analysis-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-analysis-page.component.html',
})
export class PaymentAnalysisPageComponent implements OnInit {
  payments: PaymentDetail[] = [];
  loading = true;
  totalCount = 0;
  pageSize = 20;

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.paymentService.getPayments(0, this.pageSize).subscribe({
      next: (page) => {
        this.payments = page.content;
        this.totalCount = page.totalElements;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  get paidCount(): number {
    return this.payments.filter(p => p.paymentDetailStatus === 'PAID').length;
  }

  get pendingCount(): number {
    return this.payments.filter(p => p.paymentDetailStatus === 'PENDING').length;
  }

  get expiredCount(): number {
    return this.payments.filter(p => p.paymentDetailStatus === 'EXPIRED' || p.paymentDetailStatus === 'CANCELLED').length;
  }

  get totalAmount(): number {
    return this.payments
      .filter(p => p.paymentDetailStatus === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  statusClass(status: string): string {
    switch (status) {
      case 'PAID':      return 'bg-green-100 text-green-700';
      case 'PENDING':   return 'bg-yellow-100 text-yellow-700';
      case 'EXPIRED':
      case 'CANCELLED': return 'bg-red-100 text-red-600';
      case 'DELIVERED': return 'bg-blue-100 text-blue-700';
      default:          return 'bg-gray-100 text-gray-600';
    }
  }

  formatAmount(value: number): string {
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }
}
