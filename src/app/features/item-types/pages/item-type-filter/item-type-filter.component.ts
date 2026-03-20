import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar.component';

@Component({
  selector: 'app-item-type-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterBarComponent],
  templateUrl: './item-type-filter.component.html',
})
export class ItemTypeFilterComponent {
  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();
  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  onSearchTextChange(value: string) {
    this.searchTextChange.emit(value);
  }

  onClearFilters() {
    this.searchTextChange.emit('');
    this.clearFilters.emit();
  }
}
