import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {FundingStatus, FUNDING_STATUSES} from '../../../../shared/models/funding-status.model';

@Component({
  selector: 'app-funding-status-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './funding-status-filter.component.html',
})
export class FundingStatusFilterComponent {
  @Input() status: FundingStatus | '' = '';
  @Output() statusChange = new EventEmitter<FundingStatus | ''>();

  @Input() statuses: FundingStatus[] = FUNDING_STATUSES;
  @Input() allOptionLabel = 'All Statuses';
  @Input() selectId = 'funding-status';
  @Input() showLabel = false;
  @Input() label = 'Status';

  @Output() filterChange = new EventEmitter<void>();

  onStatusChange(value: FundingStatus | ''): void {
    this.statusChange.emit(value);
    this.filterChange.emit();
  }
}
