import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentDetail } from '../../models/payment.model';
import { PaymentService } from '../../services/payment.service';
import { DetailCardComponent } from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import { DetailSectionComponent } from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import { DetailFieldComponent } from '../../../../shared/components/detail-field/detail-field/detail-field.component';

@Component({
  selector: 'app-payment-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent],
  templateUrl: './payment-view.component.html',
})
export class PaymentViewComponent implements OnInit {
  @Input() id?: string;

  payment: PaymentDetail | null = null;
  loading = false;
  error: string | null = null;

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.id) return;
    this.loading = true;
    this.error = null;
    this.paymentService.getPaymentById(this.id).subscribe({
      next: (p) => {
        this.payment = p;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load payment';
        this.payment = null;
        this.loading = false;
      },
    });
  }
}
