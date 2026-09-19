import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {FilterBarComponent} from '../../../../shared/components/filter-bar/filter-bar.component';
import {FundingStatus, FUNDING_STATUSES} from '../../../../shared/models/funding-status.model';
import {FundingStatusFilterComponent} from '../../components/funding-status-filter/funding-status-filter.component';

@Component({
  selector: 'app-investment-package-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterBarComponent, FundingStatusFilterComponent],
  templateUrl: './investment-package-filter.component.html',
  styleUrls: ['./investment-package-filter.component.css'],
})
export class InvestmentPackageFilterComponent {
  @Input() showStatus = true;

  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();

  @Input() status: FundingStatus | '' = '';
  @Output() statusChange = new EventEmitter<FundingStatus | ''>();

  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() filterChange = new EventEmitter<void>();

  readonly investmentPackageFundingStatuses = FUNDING_STATUSES;

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
