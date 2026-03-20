import {Component, ElementRef, EventEmitter, HostListener, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TrainingStatus} from '../../models/training.model';

@Component({
  selector: 'app-training-program-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './training-program-filter.component.html',
  styleUrls: ['./training-program-filter.component.css']
})
export class TrainingProgramFilterComponent {
  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();

  @Input() selectedStatuses: TrainingStatus[] = [];
  @Output() selectedStatusesChange = new EventEmitter<TrainingStatus[]>();

  @Output() filterChange = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  statusDropdownOpen = false;

  trainingStatuses: TrainingStatus[] = Object.values(TrainingStatus);

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.statusDropdownOpen = false;
    }
  }

  toggleStatusDropdown(event: Event) {
    event.stopPropagation();
    this.statusDropdownOpen = !this.statusDropdownOpen;
  }

  onSearch(): void {
    this.searchChange.emit();
  }

  onSearchTextChange(value: string): void {
    this.searchTextChange.emit(value);
  }

  onStatusToggle(status: TrainingStatus, checked: boolean): void {
    const current = new Set(this.selectedStatuses);
    if (checked) {
      current.add(status);
    } else {
      current.delete(status);
    }
    const updated = Array.from(current);
    this.selectedStatusesChange.emit(updated);
    this.filterChange.emit();
  }

  onClearFilters(): void {
    this.searchTextChange.emit('');
    this.selectedStatusesChange.emit([]);
    this.statusDropdownOpen = false;
    this.clearFilters.emit();
  }

  isStatusSelected(status: TrainingStatus): boolean {
    return this.selectedStatuses.includes(status);
  }

  getSelectedStatusCount(): number {
    return this.trainingStatuses.filter(s => this.selectedStatuses.includes(s)).length;
  }

  getSelectedStatusLabels(): string {
    const selected = this.trainingStatuses.filter(s => this.selectedStatuses.includes(s));
    if (selected.length === 0) return 'All';
    if (selected.length === this.trainingStatuses.length) return 'All';
    if (selected.length <= 2) return selected.join(', ');
    return `${selected.length} selected`;
  }
}

