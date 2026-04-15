import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar.component';

@Component({
  selector: 'app-notification-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterBarComponent],
  templateUrl: './notification-filter.component.html'
})
export class NotificationFilterComponent {
  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();

  @Input() status: string = '';
  @Output() statusChange = new EventEmitter<string>();

  @Input() priority: string = '';
  @Output() priorityChange = new EventEmitter<string>();

  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() filterChange = new EventEmitter<void>();

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

  onSearchTextChange(value: string): void {
    this.searchTextChange.emit(value);
  }

  onSearch(): void {
    this.searchChange.emit();
  }

  onStatusChange(value: string): void {
    this.statusChange.emit(value);
    this.filterChange.emit();
  }

  onPriorityChange(value: string): void {
    this.priorityChange.emit(value);
    this.filterChange.emit();
  }

  onClearFilters(): void {
    this.searchTextChange.emit('');
    this.statusChange.emit('');
    this.priorityChange.emit('');
    this.clearFilters.emit();
  }
}
