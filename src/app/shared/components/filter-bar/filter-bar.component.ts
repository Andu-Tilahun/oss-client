import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-bar.component.html',
  styleUrls: ['./filter-bar.component.css'],
})
export class FilterBarComponent {
  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();

  @Input() searchPlaceholder = 'Search...';
  @Input() applyLabel = 'Search';
  @Input() clearLabel = 'Clear Filters';

  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  onSearchTextChange(value: string): void {
    this.searchTextChange.emit(value);
  }

  onSearch(): void {
    this.searchChange.emit();
  }

  onClear(): void {
    this.clearFilters.emit();
  }
}

