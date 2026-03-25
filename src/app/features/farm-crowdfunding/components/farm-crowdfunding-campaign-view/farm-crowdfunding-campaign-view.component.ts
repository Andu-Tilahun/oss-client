import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CrowdfundingCampaign} from '../../models/farm-crowdfunding.model';

@Component({
  selector: 'app-farm-crowdfunding-campaign-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './farm-crowdfunding-campaign-view.component.html',
  styleUrl: './farm-crowdfunding-campaign-view.component.css',
})
export class FarmCrowdfundingCampaignViewComponent {
  @Input() campaign: CrowdfundingCampaign | null = null;
  @Input() refreshKey = 0;

  formatAmount(value: number | undefined): string {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(value);
  }
}

