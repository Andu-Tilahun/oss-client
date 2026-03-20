import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrainingProgram } from '../../../training-program/models/training.model';
import { ClearingAgentApplicantType } from '../../models/clearing-agent-applicant.model';
import { FilterBarComponent } from '../../../../../shared/components/filter-bar/filter-bar.component';

@Component({
  selector: 'app-clearing-agent-applicant-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterBarComponent],
  templateUrl: './clearing-agent-applicant-filter.component.html',
  styleUrls: ['./clearing-agent-applicant-filter.component.css'],
})
export class ClearingAgentApplicantFilterComponent {
  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();

  @Input() trainingPrograms: TrainingProgram[] = [];
  @Input() selectedTrainingProgramId = '';
  @Output() selectedTrainingProgramIdChange = new EventEmitter<string>();

  @Input() applicantTypes: ClearingAgentApplicantType[] = [];
  @Input() selectedApplicantTypes: ClearingAgentApplicantType[] = [];
  @Output() selectedApplicantTypesChange =
    new EventEmitter<ClearingAgentApplicantType[]>();

  @Output() filterChange = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  trainingDropdownOpen = false;
  applicantTypeDropdownOpen = false;

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.trainingDropdownOpen = false;
      this.applicantTypeDropdownOpen = false;
    }
  }

  onSearchTextInput(value: string): void {
    this.searchTextChange.emit(value);
  }

  onSearch(): void {
    this.searchChange.emit();
  }

  toggleTrainingDropdown(event: Event): void {
    event.stopPropagation();
    this.trainingDropdownOpen = !this.trainingDropdownOpen;
    if (this.trainingDropdownOpen) {
      this.applicantTypeDropdownOpen = false;
    }
  }

  toggleApplicantTypeDropdown(event: Event): void {
    event.stopPropagation();
    this.applicantTypeDropdownOpen = !this.applicantTypeDropdownOpen;
    if (this.applicantTypeDropdownOpen) {
      this.trainingDropdownOpen = false;
    }
  }

  selectTrainingProgram(id: string): void {
    this.selectedTrainingProgramIdChange.emit(id);
    this.filterChange.emit();
    this.trainingDropdownOpen = false;
  }

  isApplicantTypeSelected(type: ClearingAgentApplicantType): boolean {
    return (this.selectedApplicantTypes ?? []).includes(type);
  }

  toggleApplicantType(type: ClearingAgentApplicantType): void {
    const current = new Set(this.selectedApplicantTypes ?? []);
    if (current.has(type)) {
      current.delete(type);
    } else {
      current.add(type);
    }
    this.selectedApplicantTypesChange.emit(Array.from(current));
    this.filterChange.emit();
  }

  onClearFilters(): void {
    this.searchTextChange.emit('');
    this.selectedTrainingProgramIdChange.emit('');
    this.selectedApplicantTypesChange.emit([]);
    this.clearFilters.emit();
  }

  getSelectedTrainingLabel(): string {
    if (!this.selectedTrainingProgramId) {
      return 'All';
    }
    const p = this.trainingPrograms.find(
      (tp) => tp.id === this.selectedTrainingProgramId,
    );
    return p?.title ?? 'All';
  }

  getSelectedApplicantTypesLabel(): string {
    const selected = this.selectedApplicantTypes ?? [];
    if (!selected.length) {
      return 'All';
    }
    if (selected.length <= 2) {
      return selected.join(', ');
    }
    return `${selected.length} selected`;
  }
}

