import {Component, ElementRef, EventEmitter, HostListener, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {UserRequestType} from '../../models/workflow.model';

@Component({
  selector: 'app-workflow-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workflow-filter.component.html',
  styleUrls: ['./workflow-filter.component.css']
})
export class WorkflowFilterComponent {
  @Input() searchText = '';
  @Input() selectedRequestTypes: UserRequestType[] = [];

  @Output() searchTextChange = new EventEmitter<string>();
  @Output() selectedRequestTypesChange = new EventEmitter<UserRequestType[]>();

  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  requestTypeDropdownOpen = false;

  requestTypes: { label: string; value: UserRequestType }[] = [
    {label: 'New Training Program', value: UserRequestType.NEW_TRAINING_PROGRAM}
  ];

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.requestTypeDropdownOpen = false;
    }
  }

  onSearch() {
    this.searchChange.emit();
  }

  onSearchTextChange(value: string) {
    this.searchTextChange.emit(value);
  }

  toggleRequestTypeDropdown(event: Event) {
    event.stopPropagation();
    this.requestTypeDropdownOpen = !this.requestTypeDropdownOpen;
  }

  onRequestTypeToggle(value: UserRequestType, checked: boolean) {
    const current = new Set(this.selectedRequestTypes);
    if (checked) {
      current.add(value);
    } else {
      current.delete(value);
    }
    const updated = Array.from(current);
    this.selectedRequestTypesChange.emit(updated);
    this.searchChange.emit();
  }

  onClearFilters() {
    this.searchTextChange.emit('');
    this.selectedRequestTypesChange.emit([]);
    this.requestTypeDropdownOpen = false;
    this.clearFilters.emit();
  }

  isRequestTypeSelected(type: UserRequestType): boolean {
    return this.selectedRequestTypes.includes(type);
  }

  getSelectedRequestTypeCount(): number {
    return this.requestTypes.filter(t => this.selectedRequestTypes.includes(t.value)).length;
  }

  getSelectedRequestTypeLabels(): string {
    const selected = this.requestTypes
      .filter(t => this.selectedRequestTypes.includes(t.value))
      .map(t => t.label);

    if (selected.length === 0) return 'All';
    if (selected.length === this.requestTypes.length) return 'All';
    if (selected.length <= 2) return selected.join(', ');
    return `${selected.length} selected`;
  }
}
