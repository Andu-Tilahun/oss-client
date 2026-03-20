import {Component, EventEmitter, HostListener, Input, Output, ElementRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {OrganizationType} from '../../models/organization.model';

@Component({
  selector: 'app-organization-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './organization-filter.component.html',
  styleUrls: ['./organization-filter.component.css']
})
export class OrganizationFilterComponent {
  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();

  @Input() selectedTypes: OrganizationType[] = [];
  @Output() selectedTypesChange = new EventEmitter<OrganizationType[]>();

  @Output() filterChange = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  typeDropdownOpen = false;

  organizationTypes: { label: string; value: OrganizationType }[] = [
    {label: 'Clearing Agent', value: 'CLEARING_AGENT'},
    {label: 'Training Provider', value: 'TRAINING_PROVIDER'}
  ];

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.typeDropdownOpen = false;
    }
  }

  toggleTypeDropdown(event: Event) {
    event.stopPropagation();
    this.typeDropdownOpen = !this.typeDropdownOpen;
  }

  onSearch() {
    this.searchChange.emit();
  }

  onSearchTextChange(value: string) {
    this.searchTextChange.emit(value);
  }

  onTypeToggle(value: OrganizationType, checked: boolean) {
    const current = new Set(this.selectedTypes);
    if (checked) {
      current.add(value);
    } else {
      current.delete(value);
    }
    const updated = Array.from(current);
    this.selectedTypesChange.emit(updated);
    this.filterChange.emit();
  }

  onClearFilters() {
    this.searchTextChange.emit('');
    this.selectedTypesChange.emit([]);
    this.typeDropdownOpen = false;
    this.clearFilters.emit();
  }

  isTypeSelected(type: OrganizationType): boolean {
    return this.selectedTypes.includes(type);
  }

  getSelectedTypeCount(): number {
    return this.organizationTypes.filter(t => this.selectedTypes.includes(t.value)).length;
  }

  getSelectedTypeLabels(): string {
    const selected = this.organizationTypes
      .filter(t => this.selectedTypes.includes(t.value))
      .map(t => t.label);

    if (selected.length === 0) return 'All';
    if (selected.length === this.organizationTypes.length) return 'All';
    if (selected.length <= 2) return selected.join(', ');
    return `${selected.length} selected`;
  }
}

