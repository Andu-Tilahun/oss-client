import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-notification-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification-filter.component.html'
})
export class NotificationFilterComponent {
  @Input() status: string = '';
  @Output() statusChange = new EventEmitter<string>();

  @Input() priority: string = '';
  @Output() priorityChange = new EventEmitter<string>();

  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  statusOptions: { value: string; label: string }[] = [
    { value: '', label: 'All statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'SENT', label: 'Sent' },
    { value: 'RETRY', label: 'Retry' },
    { value: 'DLQ', label: 'DLQ' }
  ];

  priorityOptions: { value: string; label: string }[] = [
    { value: '', label: 'All priorities' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' }
  ];

  onSearch(): void {
    this.searchChange.emit();
  }

  onStatusChange(value: string): void {
    this.statusChange.emit(value);
  }

  onPriorityChange(value: string): void {
    this.priorityChange.emit(value);
  }

  onClearFilters(): void {
    this.statusChange.emit('');
    this.priorityChange.emit('');
    this.clearFilters.emit();
  }
}
