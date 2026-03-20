import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-bar.component.html',
  styleUrls: ['./filter-bar.component.css'],
})
export class FilterBarComponent implements OnChanges {
  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();

  @Input() searchPlaceholder = 'Search...';
  @Input() applyLabel = 'Search';
  @Input() clearLabel = 'Clear Filters';

  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  /**
   * Allows the dropdown/filter area to be collapsed/expanded.
   */
  @Input() collapsible = true;
  @Input() collapsedByDefault = false;

  protected isCollapsed = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['collapsedByDefault']) {
      this.isCollapsed = !!this.collapsedByDefault;
    }
  }

  get hasValidSearchText(): boolean {
    return this.searchText.trim().length > 0;
  }

  onSearchTextChange(value: string): void {
    this.searchTextChange.emit(value);
  }

  onSearch(): void {
    if (!this.hasValidSearchText) return;
    this.searchChange.emit();
  }

  onClear(): void {
    this.clearFilters.emit();
  }

  toggleCollapsed(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}

