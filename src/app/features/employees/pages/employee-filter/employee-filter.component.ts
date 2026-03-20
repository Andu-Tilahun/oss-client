import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeStatus } from '../../models/employee.model';
import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar.component';
import { Department } from '../../../departments/models/department.model';
import { DepartmentService } from '../../../departments/services/department.service';

@Component({
  selector: 'app-employee-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterBarComponent],
  templateUrl: './employee-filter.component.html',
})
export class EmployeeFilterComponent implements OnInit {
  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();

  @Input() selectedStatuses: EmployeeStatus[] = [];
  @Output() selectedStatusesChange = new EventEmitter<EmployeeStatus[]>();

  @Input() selectedDepartmentId = '';
  @Output() selectedDepartmentIdChange = new EventEmitter<string>();

  @Output() filterChange = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  statusDropdownOpen = false;
  departments: Department[] = [];

  readonly statuses: EmployeeStatus[] = ['Active', 'Inactive'];

  constructor(
    private elementRef: ElementRef,
    private departmentService: DepartmentService
  ) {}

  ngOnInit(): void {
    this.departmentService.getAll().subscribe({
      next: (list) => (this.departments = list ?? []),
      error: (err) => console.error('Failed to load departments', err),
    });
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.statusDropdownOpen = false;
    }
  }

  onSearchTextInput(value: string): void {
    this.searchTextChange.emit(value);
  }

  onSearch(): void {
    this.searchChange.emit();
  }

  toggleStatusDropdown(event: Event): void {
    event.stopPropagation();
    this.statusDropdownOpen = !this.statusDropdownOpen;
  }

  isStatusSelected(status: EmployeeStatus): boolean {
    return (this.selectedStatuses ?? []).includes(status);
  }

  toggleStatus(status: EmployeeStatus): void {
    const current = new Set(this.selectedStatuses ?? []);
    if (current.has(status)) {
      current.delete(status);
    } else {
      current.add(status);
    }
    this.selectedStatusesChange.emit(Array.from(current));
    this.filterChange.emit();
  }

  onDepartmentChange(value: string): void {
    this.selectedDepartmentIdChange.emit(value);
    this.filterChange.emit();
  }

  onClearFilters(): void {
    this.searchTextChange.emit('');
    this.selectedStatusesChange.emit([]);
    this.selectedDepartmentIdChange.emit('');
    this.clearFilters.emit();
  }

  getSelectedStatusesLabel(): string {
    const selected = this.selectedStatuses ?? [];
    if (!selected.length) return 'All';
    if (selected.length <= 1) return selected.join(', ');
    return `${selected.length} selected`;
  }
}
