import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {FilterBarComponent} from '../../../../shared/components/filter-bar/filter-bar.component';
import { InvestmentStatus} from '../../models/crowd-funding.model';

@Component({
  selector: 'app-crowd-funding-investment-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterBarComponent],
  templateUrl: './crowd-funding-investment-filter.component.html',
  styleUrls: ['./crowd-funding-investment-filter.component.css'],
})
export class CrowdFundingInvestmentFilterComponent {
  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();

  @Input() status: InvestmentStatus | '' = '';
  @Output() statusChange = new EventEmitter<InvestmentStatus | ''>();


  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() filterChange = new EventEmitter<void>();

  readonly statuses: InvestmentStatus[] = ['PENDING', 'ACTIVE', 'PAID', 'FAILED'];

  onSearchTextChange(value: string) {
    this.searchTextChange.emit(value);
  }

  onSearch() {
    this.searchChange.emit();
  }

  onStatusChange(value: InvestmentStatus | '') {
    this.statusChange.emit(value);
    this.filterChange.emit();
  }


  onClearFilters() {
    this.searchTextChange.emit('');
    this.statusChange.emit('');
    this.clearFilters.emit();
  }
}

