import {CommonModule} from '@angular/common';
import {Component, Input} from '@angular/core';
import {InvestmentRecord} from '../../models/farm-crowdfunding.model';

@Component({
  selector: 'app-farm-crowdfunding-investment-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './farm-crowdfunding-investment-view.component.html',
  styleUrl: './farm-crowdfunding-investment-view.component.css',
})
export class FarmCrowdfundingInvestmentViewComponent {
  @Input() investment: InvestmentRecord | null = null;
  @Input() refreshKey = 0;

  formatAmount(value: number | undefined): string {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(value);
  }
}

