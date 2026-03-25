import {Component, Input, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LeaseAgreement, LeaseCreateRequest} from '../../models/farm-lease.model';
import {FarmLeasePaymentFormComponent} from '../farm-lease-payment-form/farm-lease-payment-form.component';

/**
 * Step-level wrapper for the farm lease payment schedule (title + form).
 */
@Component({
  selector: 'app-farm-lease-payment-page',
  standalone: true,
  imports: [CommonModule, FarmLeasePaymentFormComponent],
  templateUrl: './farm-lease-payment-page.component.html',
  styleUrls: ['./farm-lease-payment-page.component.css'],
})
export class FarmLeasePaymentPageComponent {
  @Input() leaseDetails: LeaseCreateRequest | null = null;
  @Input() lease: LeaseAgreement | null = null;
  @Input() readOnly = false;

  @ViewChild(FarmLeasePaymentFormComponent) paymentForm!: FarmLeasePaymentFormComponent;
}
