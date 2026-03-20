import { Component } from '@angular/core';
import { PaymentService } from '../../services/payment.service';
import { PaymentDetail } from '../../models/payment.model';
import { ToastService } from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-payment-by-order',
  standalone: false,
  templateUrl: './payment-by-order.component.html'
})
export class PaymentByOrderComponent {
  orderNumber = '';
  transactionId = '';
  payment: PaymentDetail | null = null;
  loading = false;
  processing = false;

  constructor(
    private paymentService: PaymentService,
    private toastService: ToastService
  ) {}

  fetchPayment(): void {
    if (!this.orderNumber.trim()) {
      this.toastService.warning('Please enter an order number');
      return;
    }
    this.loading = true;
    this.payment = null;
    this.paymentService.getPaymentByOrderNumber(this.orderNumber.trim()).subscribe({
      next: (data) => {
        this.payment = data ?? null;
        this.loading = false;
        if (this.payment) {
          this.toastService.success('Payment detail retrieved');
        } else {
          this.toastService.info('No payment found for this order number');
        }
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err?.message || 'Failed to fetch payment');
      }
    });
  }

  processPayment(): void {
    if (!this.orderNumber.trim()) {
      this.toastService.warning('Please enter an order number');
      return;
    }
    if (!this.transactionId.trim()) {
      this.toastService.warning('Please enter a transaction ID');
      return;
    }
    this.processing = true;
    this.paymentService.processPaymentByOrderNumber(this.orderNumber.trim(), {
      transactionId: this.transactionId.trim()
    }).subscribe({
      next: (updated) => {
        this.payment = updated;
        this.processing = false;
        this.toastService.success('Payment processed successfully');
      },
      error: (err) => {
        this.processing = false;
        this.toastService.error(err?.message || 'Failed to process payment');
      }
    });
  }
}
