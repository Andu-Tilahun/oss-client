import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterOption } from '../../../../shared/models/filter.model';
import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar.component';


@Component({
  selector: 'app-user-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterBarComponent],
  templateUrl: './user-filter.component.html',
  styleUrls: ['./user-filter.component.css']
})
export class UserFilterComponent implements OnInit, OnDestroy {
  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();
  @Input() roleFilters: FilterOption[] = [];
  @Input() genderFilters: FilterOption[] = [];

  @Output() filterChange = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  selectedRole = '';
  selectedGender = '';

  constructor() {}

  ngOnInit() {
    // Component initialization
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  onFilterChange() {
    this.filterChange.emit();
  }

  onSearch() {
    this.searchChange.emit();
  }

  onSearchTextChange(value: string) {
    this.searchTextChange.emit(value);
  }

  onClearFilters() {
    this.searchTextChange.emit('');
    this.selectedRole = '';
    this.selectedGender = '';
    this.roleFilters.forEach(f => f.checked = false);
    this.genderFilters.forEach(f => f.checked = false);
    this.clearFilters.emit();
  }

  onRoleSelectionChange(value: string): void {
    this.selectedRole = value;
    this.roleFilters.forEach((f) => {
      f.checked = !!value && f.value === value;
    });
    this.onFilterChange();
  }

  onGenderSelectionChange(value: string): void {
    this.selectedGender = value;
    this.genderFilters.forEach((f) => {
      f.checked = !!value && f.value === value;
    });
    this.onFilterChange();
  }

  getSelectedCount(filters: FilterOption[]): number {
    return filters.filter(f => f.checked).length;
  }

  getSelectedLabels(filters: FilterOption[]): string {
    const selected = filters.filter(f => f.checked).map(f => f.label);
    if (selected.length === 0) return 'All';
    if (selected.length === filters.length) return 'All';
    if (selected.length <= 2) return selected.join(', ');
    return `${selected.length} selected`;
  }

  get totalActiveFilters(): number {
    return this.getSelectedCount(this.roleFilters) + this.getSelectedCount(this.genderFilters);
  }
}
