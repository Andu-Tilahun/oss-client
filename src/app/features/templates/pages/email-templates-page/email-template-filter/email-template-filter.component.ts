import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterBarComponent } from '../../../../../shared/components/filter-bar/filter-bar.component';
import { SERVICE_OPTIONS, TemplateService } from '../../../../system-config/models/message-template.model';

@Component({
  selector: 'app-email-template-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterBarComponent],
  templateUrl: './email-template-filter.component.html',
})
export class EmailTemplateFilterComponent {
  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();

  @Input() selectedService: TemplateService | '' = '';
  @Output() selectedServiceChange = new EventEmitter<TemplateService | ''>();

  @Output() filterChange = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  readonly serviceOptions = SERVICE_OPTIONS;

  onSearchTextInput(value: string): void {
    this.searchTextChange.emit(value);
  }

  onSearch(): void {
    this.searchChange.emit();
  }

  onServiceChange(value: string): void {
    this.selectedServiceChange.emit(value as TemplateService | '');
    this.filterChange.emit();
  }

  onClearFilters(): void {
    this.searchTextChange.emit('');
    this.selectedServiceChange.emit('');
    this.clearFilters.emit();
  }
}
