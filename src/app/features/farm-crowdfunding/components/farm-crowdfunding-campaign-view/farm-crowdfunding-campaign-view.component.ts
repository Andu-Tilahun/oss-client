import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CrowdfundingCampaign, FundingStatus} from '../../models/farm-crowdfunding.model';
import {DetailCardComponent} from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import {DetailSectionComponent} from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import {DetailFieldComponent} from '../../../../shared/components/detail-field/detail-field/detail-field.component';

@Component({
  selector: 'app-farm-crowdfunding-campaign-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent],
  templateUrl: './farm-crowdfunding-campaign-view.component.html',
  styleUrl: './farm-crowdfunding-campaign-view.component.css',
})
export class FarmCrowdfundingCampaignViewComponent {
  @Input() campaign: CrowdfundingCampaign | null = null;
  @Input() refreshKey = 0;

  statusPillClass(status: FundingStatus | string | null | undefined): string {
    const s = (status ?? '').toString().trim().toUpperCase();
    switch (s) {
      case 'OPEN':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'CLOSED':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'FUNDED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'FAILED':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  formatAmount(value: number | undefined): string {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(value);
  }
}

