import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
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

  // Dropdown states
  roleDropdownOpen = false;
  genderDropdownOpen = false;

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    // Component initialization
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.roleDropdownOpen = false;
      this.genderDropdownOpen = false;
    }
  }

  toggleRoleDropdown(event: Event) {
    event.stopPropagation();
    this.roleDropdownOpen = !this.roleDropdownOpen;
    this.genderDropdownOpen = false;
  }

  toggleGenderDropdown(event: Event) {
    event.stopPropagation();
    this.genderDropdownOpen = !this.genderDropdownOpen;
    this.roleDropdownOpen = false;
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
    this.roleFilters.forEach(f => f.checked = false);
    this.genderFilters.forEach(f => f.checked = false);
    this.clearFilters.emit();
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
