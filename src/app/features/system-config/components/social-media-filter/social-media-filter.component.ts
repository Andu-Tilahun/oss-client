import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar.component';
import { SocialMediaPlatform } from '../../models/social-media.model';

@Component({
  selector: 'app-social-media-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterBarComponent],
  templateUrl: './social-media-filter.component.html',
})
export class SocialMediaFilterComponent {
  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();

  @Input() selectedPlatform: SocialMediaPlatform | '' = '';
  @Output() selectedPlatformChange = new EventEmitter<SocialMediaPlatform | ''>();

  @Output() filterChange = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  readonly platforms: SocialMediaPlatform[] = [
    'FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'LINKEDIN', 'X', 'TWITTER', 'TELEGRAM', 'WHATSAPP',
  ];

  onSearchTextInput(value: string): void {
    this.searchTextChange.emit(value);
  }

  onSearch(): void {
    this.searchChange.emit();
  }

  onPlatformChange(value: string): void {
    this.selectedPlatformChange.emit(value as SocialMediaPlatform | '');
    this.filterChange.emit();
  }

  onClearFilters(): void {
    this.searchTextChange.emit('');
    this.selectedPlatformChange.emit('');
    this.clearFilters.emit();
  }
}
