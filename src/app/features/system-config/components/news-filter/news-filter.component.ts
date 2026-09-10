import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar.component';
import { NewsAudience, NewsStatus } from '../../models/news-article.model';

@Component({
  selector: 'app-news-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterBarComponent],
  templateUrl: './news-filter.component.html',
})
export class NewsFilterComponent {
  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();

  @Input() selectedStatus: NewsStatus | '' = '';
  @Output() selectedStatusChange = new EventEmitter<NewsStatus | ''>();

  @Input() selectedAudience: NewsAudience | '' = '';
  @Output() selectedAudienceChange = new EventEmitter<NewsAudience | ''>();

  @Output() filterChange = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  readonly statuses: NewsStatus[] = ['DRAFT', 'PUBLISHED', 'INACTIVE'];
  readonly audiences: NewsAudience[] = ['PUBLIC', 'INVESTOR', 'EXTENSION_WORKER'];

  onSearchTextInput(value: string): void {
    this.searchTextChange.emit(value);
  }

  onSearch(): void {
    this.searchChange.emit();
  }

  onStatusChange(value: string): void {
    this.selectedStatusChange.emit(value as NewsStatus | '');
    this.filterChange.emit();
  }

  onAudienceChange(value: string): void {
    this.selectedAudienceChange.emit(value as NewsAudience | '');
    this.filterChange.emit();
  }

  onClearFilters(): void {
    this.searchTextChange.emit('');
    this.selectedStatusChange.emit('');
    this.selectedAudienceChange.emit('');
    this.clearFilters.emit();
  }
}
