import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {PaymentType} from '../../models/service-fee.model';

@Component({
  selector: 'app-service-fee-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-fee-filter.component.html',
  styleUrls: ['./service-fee-filter.component.css']
})
export class ServiceFeeFilterComponent {
  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();

  @Input() paymentType: PaymentType | '' = '';
  @Output() paymentTypeChange = new EventEmitter<PaymentType | ''>();

  @Input() active: '' | 'true' | 'false' = 'true';
  @Output() activeChange = new EventEmitter<'' | 'true' | 'false'>();

  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  paymentTypeOptions: { value: PaymentType; label: string }[] = [
    {value: 'CLEARING_AGENT_CERTIFICATE_FEE', label: 'Clearing Agent Certificate Fee'},
  ];

  onSearch() {
    this.searchChange.emit();
  }

  onSearchTextChange(value: string) {
    this.searchTextChange.emit(value);
  }

  onPaymentTypeChange(value: PaymentType | '') {
    this.paymentTypeChange.emit(value);
  }

  onActiveChange(value: '' | 'true' | 'false') {
    this.activeChange.emit(value);
  }

  onClearFilters() {
    this.searchTextChange.emit('');
    this.paymentTypeChange.emit('');
    this.activeChange.emit('true');
    this.clearFilters.emit();
  }
}

