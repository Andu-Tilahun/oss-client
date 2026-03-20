import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceFee, PaymentType } from '../../models/service-fee.model';
import { ServiceFeeService } from '../../services/service-fee.service';
import { DetailCardComponent } from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import { DetailSectionComponent } from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import { DetailFieldComponent } from '../../../../shared/components/detail-field/detail-field/detail-field.component';

@Component({
  selector: 'app-service-fee-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent],
  templateUrl: './service-fee-view.component.html',
})
export class ServiceFeeViewComponent implements OnInit {
  @Input() id?: string;

  fee: ServiceFee | null = null;
  loading = false;
  error: string | null = null;

  constructor(private serviceFeeService: ServiceFeeService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.id) return;
    this.loading = true;
    this.error = null;
    this.serviceFeeService.getServiceFeeById(this.id).subscribe({
      next: (f) => {
        this.fee = f;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load service fee';
        this.fee = null;
        this.loading = false;
      },
    });
  }

  formatPaymentType(pt: PaymentType): string {
    return pt
      .split('_')
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');
  }
}
