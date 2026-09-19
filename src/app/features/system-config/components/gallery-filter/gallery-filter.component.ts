import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar.component';
import { GalleryMediaKind } from '../../models/gallery-item.model';

@Component({
  selector: 'app-gallery-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterBarComponent],
  templateUrl: './gallery-filter.component.html',
})
export class GalleryFilterComponent {
  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();

  @Input() selectedKind: GalleryMediaKind | '' = '';
  @Output() selectedKindChange = new EventEmitter<GalleryMediaKind | ''>();

  @Output() filterChange = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  readonly kinds: GalleryMediaKind[] = ['IMAGE', 'VIDEO'];

  onSearchTextInput(value: string): void {
    this.searchTextChange.emit(value);
  }

  onSearch(): void {
    this.searchChange.emit();
  }

  onKindChange(value: string): void {
    this.selectedKindChange.emit(value as GalleryMediaKind | '');
    this.filterChange.emit();
  }

  onClearFilters(): void {
    this.searchTextChange.emit('');
    this.selectedKindChange.emit('');
    this.clearFilters.emit();
  }
}
