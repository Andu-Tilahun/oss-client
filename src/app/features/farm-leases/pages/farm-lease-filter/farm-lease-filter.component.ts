import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {LeaseStatus} from '../../models/farm-lease.model';
import {FilterBarComponent} from '../../../../shared/components/filter-bar/filter-bar.component';

@Component({
  selector: 'app-farm-lease-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterBarComponent],
  templateUrl: './farm-lease-filter.component.html',
  styleUrls: ['./farm-lease-filter.component.css'],
})
export class FarmLeaseFilterComponent {
  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();

  @Input() status: LeaseStatus | '' = '';
  @Output() statusChange = new EventEmitter<LeaseStatus | ''>();

  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() filterChange = new EventEmitter<void>();

  readonly statuses: LeaseStatus[] = ['ACTIVE', 'PENDING', 'TERMINATED'];

  onSearchTextChange(value: string) {
    this.searchTextChange.emit(value);
  }

  onSearch() {
    this.searchChange.emit();
  }

  onStatusChange(value: LeaseStatus | '') {
    this.statusChange.emit(value);
    this.filterChange.emit();
  }

  onClearFilters() {
    this.searchTextChange.emit('');
    this.statusChange.emit('');
    this.clearFilters.emit();
  }
}
