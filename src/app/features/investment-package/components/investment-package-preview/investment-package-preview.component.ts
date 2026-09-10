import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FarmActivity,
  InvestmentPackageType,
  InvestmentPaymentMethod,
  WaterSource,
} from '../../models/investment-package.model';
import { FundingStatus } from '../../../../shared/models/funding-status.model';

export interface InvestmentPackagePreviewData {
  title?: string;
  investmentPackageType?: InvestmentPackageType;
  farmPlotTitle?: string;
  farmActivity?: FarmActivity;
  waterSource?: WaterSource;
  description?: string;
  startDate?: string;
  endDate?: string;
  fundingDeadline?: string;
  targetAmount?: number;
  minimumContribution?: number;
  roiPercent?: number | null;
  fundingStatus?: FundingStatus;
  allowedPaymentMethods?: InvestmentPaymentMethod[];
  allowedBankAccountNames?: string[];
}

@Component({
  selector: 'app-investment-package-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './investment-package-preview.component.html',
})
export class InvestmentPackagePreviewComponent {
  @Input({ required: true }) data!: InvestmentPackagePreviewData;

  get isCrowdfunding(): boolean {
    return this.data.investmentPackageType === 'CROWDFUNDING';
  }

  formatMethodLabel(m: string): string {
    const labels: Record<string, string> = {
      CREDIT: 'Credit / Direct',
      BANK_TRANSFER: 'Bank Transfer',
      CRYPTO: 'Cryptocurrency',
    };
    return labels[m] ?? m;
  }

  get showBankAccounts(): boolean {
    return !!this.data.allowedPaymentMethods?.includes('BANK_TRANSFER');
  }
}
