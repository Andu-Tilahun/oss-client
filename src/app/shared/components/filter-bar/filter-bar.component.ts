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
  @Input() showSearch = true;
  /** Independent of showSearch: some filter bars have no search text, only a dropdown, but still need an explicit apply trigger. */
  @Input() showApplyButton = true;

  @Input() searchPlaceholder = 'Search...';
  @Input() applyLabel = 'Search';
  @Input() clearLabel = 'Clear Filters';
  @Input() useIconButtons = false;

  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  /**
   * Controls the mobile filter sheet. Below the `md` breakpoint the projected dropdowns
   * (and the Clear button) render as a slide-up sheet behind a filter-icon toggle instead
   * of an always-visible row. Set `collapsible` to false to keep the old always-inline
   * behavior (with horizontal scroll) on every screen size.
   */
  @Input() collapsible = true;
  @Input() collapsedByDefault = false;

  /** Mobile-only: whether the filter sheet is closed. Ignored at md: and above, where filters always render inline. */
  protected isCollapsed = true;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['collapsedByDefault']) {
      this.isCollapsed = !!this.collapsedByDefault;
    }
  }

  get hasValidSearchText(): boolean {
    if (!this.showSearch) return true;
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

