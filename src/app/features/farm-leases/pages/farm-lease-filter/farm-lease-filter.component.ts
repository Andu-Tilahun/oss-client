import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {FilterBarComponent} from '../../../../shared/components/filter-bar/filter-bar.component';
import {FundingStatus, FUNDING_STATUSES} from '../../../../shared/models/funding-status.model';
import {FundingStatusFilterComponent} from '../../../investment-package/components/funding-status-filter/funding-status-filter.component';
import {InvestmentPaymentStatus} from '../../../investment-package/models/investment-package.model';
import {FarmPlotSoilType} from '../../../farm-plots/models/farm-plot.model';

@Component({
  selector: 'app-farm-lease-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterBarComponent, FundingStatusFilterComponent],
  templateUrl: './farm-lease-filter.component.html',
  styleUrls: ['./farm-lease-filter.component.css'],
})
export class FarmLeaseFilterComponent {
  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();

  @Input() status: FundingStatus | '' = '';
  @Output() statusChange = new EventEmitter<FundingStatus | ''>();

  @Input() paymentStatus: InvestmentPaymentStatus | '' = '';
  @Output() paymentStatusChange = new EventEmitter<InvestmentPaymentStatus | ''>();

  @Input() showSoilType = false;
  @Input() soilType: FarmPlotSoilType | '' = '';
  @Output() soilTypeChange = new EventEmitter<FarmPlotSoilType | ''>();

  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() filterChange = new EventEmitter<void>();

  readonly leasingFundingStatuses = FUNDING_STATUSES;
  readonly paymentStatuses: InvestmentPaymentStatus[] = ['PENDING', 'PAID', 'FAILED'];
  readonly soilTypes: FarmPlotSoilType[] = ['SANDY', 'CLAY', 'LOAMY'];

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

  onPaymentStatusChange(value: InvestmentPaymentStatus | '') {
    this.paymentStatusChange.emit(value);
    this.filterChange.emit();
  }

  onSoilTypeChange(value: FarmPlotSoilType | '') {
    this.soilTypeChange.emit(value);
    this.filterChange.emit();
  }

  onClearFilters() {
    this.searchTextChange.emit('');
    this.statusChange.emit('');
    this.paymentStatusChange.emit('');
    if (this.showSoilType) {
      this.soilTypeChange.emit('');
    }
    this.clearFilters.emit();
  }
}
