import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {FilterBarComponent} from '../../../../shared/components/filter-bar/filter-bar.component';
import {InvestmentApprovalStatus, InvestmentStatus} from '../../models/farm-crowdfunding.model';

@Component({
  selector: 'app-farm-crowdfunding-investment-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterBarComponent],
  templateUrl: './farm-crowdfunding-investment-filter.component.html',
  styleUrls: ['./farm-crowdfunding-investment-filter.component.css'],
})
export class FarmCrowdfundingInvestmentFilterComponent {
  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();

  @Input() status: InvestmentStatus | '' = '';
  @Output() statusChange = new EventEmitter<InvestmentStatus | ''>();

  @Input() approval: InvestmentApprovalStatus | '' = '';
  @Output() approvalChange = new EventEmitter<InvestmentApprovalStatus | ''>();

  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() filterChange = new EventEmitter<void>();

  readonly statuses: InvestmentStatus[] = ['PENDING', 'ACTIVE', 'PAID', 'FAILED'];
  readonly approvals: InvestmentApprovalStatus[] = ['PENDING', 'ACCEPTED', 'REJECTED'];

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

  onApprovalChange(value: InvestmentApprovalStatus | '') {
    this.approvalChange.emit(value);
    this.filterChange.emit();
  }

  onClearFilters() {
    this.searchTextChange.emit('');
    this.statusChange.emit('');
    this.approvalChange.emit('');
    this.clearFilters.emit();
  }
}

