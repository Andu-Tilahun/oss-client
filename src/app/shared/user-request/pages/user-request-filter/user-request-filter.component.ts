import {Component, ElementRef, EventEmitter, HostListener, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-user-request-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-request-filter.component.html',
  styleUrls: ['./user-request-filter.component.css']
})
export class UserRequestFilterComponent {
  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();

  @Input() selectedRequestTypes: string[] = [];
  @Output() selectedRequestTypesChange = new EventEmitter<string[]>();

  @Input() selectedStatus = '';
  @Output() selectedStatusChange = new EventEmitter<string>();

  @Input() requestTypes: string[] = [];
  @Input() statusOptions: string[] = [];

  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() filterChange = new EventEmitter<void>();

  requestTypeDropdownOpen = false;

  constructor(private elementRef: ElementRef) {}

  onSearch(): void {
    this.searchChange.emit();
  }

  onSearchTextChange(value: string): void {
    this.searchTextChange.emit(value);
  }

  onRequestTypeToggle(type: string, checked: boolean): void {
    const current = [...this.selectedRequestTypes];
    if (checked) {
      current.push(type);
    } else {
      const i = current.indexOf(type);
      if (i >= 0) current.splice(i, 1);
    }
    this.selectedRequestTypesChange.emit(current);
    this.filterChange.emit();
  }

  isRequestTypeSelected(type: string): boolean {
    return this.selectedRequestTypes.includes(type);
  }

  getSelectedRequestTypeLabels(): string {
    if (this.selectedRequestTypes.length === 0) return 'All';
    if (this.selectedRequestTypes.length === this.requestTypes.length) return 'All';
    if (this.selectedRequestTypes.length <= 2) return this.selectedRequestTypes.join(', ');
    return `${this.selectedRequestTypes.length} selected`;
  }

  toggleRequestTypeDropdown(event: Event): void {
    event.stopPropagation();
    this.requestTypeDropdownOpen = !this.requestTypeDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.requestTypeDropdownOpen = false;
    }
  }

  onStatusChange(value: string): void {
    this.selectedStatusChange.emit(value);
    this.filterChange.emit();
  }

  onClearFilters(): void {
    this.searchTextChange.emit('');
    this.selectedRequestTypesChange.emit([]);
    this.selectedStatusChange.emit('');
    this.requestTypeDropdownOpen = false;
    this.clearFilters.emit();
  }
}
