import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentDetail } from '../../../payments/models/payment.model';
import { DetailCardComponent } from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import { DetailSectionComponent } from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import { DetailFieldComponent } from '../../../../shared/components/detail-field/detail-field/detail-field.component';

@Component({
  selector: 'app-payment-detail-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent],
  templateUrl: './payment-detail-view.component.html',
})
export class PaymentDetailViewComponent {
  @Input() payment: PaymentDetail | null = null;

  statusPillClass(status: string): string {
    switch (status) {
      case 'PAID':      return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING':   return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'EXPIRED':
      case 'CANCELLED': return 'bg-red-100 text-red-600 border-red-200';
      case 'DELIVERED': return 'bg-blue-100 text-blue-700 border-blue-200';
      default:          return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  }

  formatAmount(value: number): string {
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
