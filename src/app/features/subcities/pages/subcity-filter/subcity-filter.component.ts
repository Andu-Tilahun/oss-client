import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-subcity-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subcity-filter.component.html',
  styleUrls: ['./subcity-filter.component.css']
})
export class SubcityFilterComponent {
  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();

  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  onSearch() {
    this.searchChange.emit();
  }

  onSearchTextChange(value: string) {
    this.searchTextChange.emit(value);
  }

  onClearFilters() {
    this.searchTextChange.emit('');
    this.clearFilters.emit();
  }
}

