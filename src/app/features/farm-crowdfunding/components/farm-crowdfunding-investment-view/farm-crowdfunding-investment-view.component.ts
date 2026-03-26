import {CommonModule} from '@angular/common';
import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {InvestmentRecord} from '../../models/farm-crowdfunding.model';
import {FarmFollowUpsService} from '../../../farm-followups/services/farm-followups.service';
import {FarmOperationFollowUp} from '../../../farm-followups/models/farm-followups.model';

@Component({
  selector: 'app-farm-crowdfunding-investment-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './farm-crowdfunding-investment-view.component.html',
  styleUrl: './farm-crowdfunding-investment-view.component.css',
})
export class FarmCrowdfundingInvestmentViewComponent implements OnChanges {
  @Input() investment: InvestmentRecord | null = null;
  @Input() refreshKey = 0;

  followUps: FarmOperationFollowUp[] = [];
  followUpsLoading = false;

  formatAmount(value: number | undefined): string {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(value);
  }

  constructor(private followUpsService: FarmFollowUpsService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['investment'] || changes['refreshKey']) {
      this.loadFollowUps();
    }
  }

  private loadFollowUps(): void {
    const operationId = this.investment?.campaign?.farmOperationId ?? this.investment?.campaign?.farmOperation?.id;
    if (!operationId) {
      this.followUps = [];
      return;
    }

    this.followUpsLoading = true;
    this.followUpsService.getFarmOperationFollowUpsHistory(operationId).subscribe({
      next: (items) => {
        this.followUps = items;
        this.followUpsLoading = false;
      },
      error: () => {
        this.followUps = [];
        this.followUpsLoading = false;
      },
    });
  }
}

