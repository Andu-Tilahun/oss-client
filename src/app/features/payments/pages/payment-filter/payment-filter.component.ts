import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payment-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-filter.component.html'
})
export class PaymentFilterComponent {
  @Input() status: string = '';
  @Output() statusChange = new EventEmitter<string>();

  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  statusOptions: { value: string; label: string }[] = [
    { value: '', label: 'All statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PAID', label: 'Paid' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'DELIVERED', label: 'Delivered' }
  ];

  onSearch(): void {
    this.searchChange.emit();
  }

  onStatusChange(value: string): void {
    this.statusChange.emit(value);
  }

  onClearFilters(): void {
    this.statusChange.emit('');
    this.clearFilters.emit();
  }
}
