import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {FilterBarComponent} from '../../../../shared/components/filter-bar/filter-bar.component';
import {FundingStatus} from '../../models/farm-crowdfunding.model';

@Component({
  selector: 'app-farm-crowdfunding-campaign-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterBarComponent],
  templateUrl: './farm-crowdfunding-campaign-filter.component.html',
  styleUrls: ['./farm-crowdfunding-campaign-filter.component.css'],
})
export class FarmCrowdfundingCampaignFilterComponent {
  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();

  @Input() status: FundingStatus | '' = '';
  @Output() statusChange = new EventEmitter<FundingStatus | ''>();

  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() filterChange = new EventEmitter<void>();

  readonly statuses: FundingStatus[] = ['OPEN', 'CLOSED', 'FUNDED', 'FAILED'];

  onSearchTextChange(value: string) {
    this.searchTextChange.emit(value);
  }

  onSearch() {
    this.searchChange.emit();
  }

  onStatusChange(value: FundingStatus | '') {
    this.statusChange.emit(value);
    this.filterChange.emit();
  }

  onClearFilters() {
    this.searchTextChange.emit('');
    this.statusChange.emit('');
    this.clearFilters.emit();
  }
}

