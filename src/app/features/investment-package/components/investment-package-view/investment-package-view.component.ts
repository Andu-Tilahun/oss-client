import {Component, Input, OnChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {InvestmentPackage, InvestmentRecord} from '../../models/investment-package.model';
import {FundingStatus} from '../../../../shared/models/funding-status.model';
import {packageStatusBadgeClass} from '../../utils/investment-package-status.util';
import {DetailCardComponent} from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import {DetailSectionComponent} from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import {DetailFieldComponent} from '../../../../shared/components/detail-field/detail-field/detail-field.component';
import {NgxEchartsDirective} from 'ngx-echarts';
import type {EChartsOption} from 'echarts';

@Component({
  selector: 'app-investment-package-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent, NgxEchartsDirective],
  templateUrl: './investment-package-view.component.html',
  styleUrl: './investment-package-view.component.css',
})
export class InvestmentPackageViewComponent implements OnChanges {
  @Input() investmentPackage: InvestmentPackage | null = null;
  @Input() refreshKey = 0;
  @Input() packageInvestments: InvestmentRecord[] = [];
  @Input() isAdminRole = false;
  @Input() isInvestorRole = false;

  investorShareChartOption: EChartsOption = {};
  fundingProgressChartOption: EChartsOption = {};

  ngOnChanges(): void {
    this.investorShareChartOption = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'horizontal', bottom: 0 },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        label: { show: false },
        emphasis: { label: { show: true, fontWeight: 'bold' } },
        data: this.activeInvestments.map(r => ({
          name: this.formatInvestorName(r),
          value: r.amount,
        })),
      }],
    };
    const planned = this.investmentPackage?.targetAmount ?? 0;
    const remaining = this.investmentPackage?.remainingCapacity ?? Math.max(0, planned - this.totalContributed);
    const collected = planned - remaining;
    const fullyFunded = planned > 0 && remaining <= 0;
    this.fundingProgressChartOption = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'horizontal', bottom: 0 },
      graphic: [{
        type: 'text',
        left: 'center',
        top: '38%',
        style: {
          text: fullyFunded
            ? `Fully Funded\n${this.formatAmount(planned)}`
            : `Planned\n${this.formatAmount(planned)}`,
          fontSize: 12,
          fontWeight: 'bold',
          fill: fullyFunded ? '#16A34A' : '#374151',
          textAlign: 'center',
        },
      }] as any[],
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        label: { show: false },
        emphasis: { label: { show: true, fontWeight: 'bold' } },
        data: fullyFunded
          ? [{ name: 'Funded', value: planned, itemStyle: { color: '#16A34A' } }]
          : [
              // In progress: show what's collected (indigo) and what remains to planned (green)
              { name: 'Collected', value: collected, itemStyle: { color: '#4F46E5' } },
              { name: 'Remaining', value: remaining, itemStyle: { color: '#16A34A' } },
            ],
      }],
    };
  }

  get activeInvestments(): InvestmentRecord[] {
    return this.packageInvestments.filter(
      r => r.status !== 'CANCELED' && r.status !== 'FAILED' && r.status !== 'REJECTED'
    );
  }

  get totalContributed(): number {
    return this.activeInvestments.reduce((sum, r) => sum + (r.amount ?? 0), 0);
  }

  get isFullyFunded(): boolean {
    const planned = this.investmentPackage?.targetAmount ?? 0;
    const remaining = this.investmentPackage?.remainingCapacity ?? Math.max(0, planned - this.totalContributed);
    return planned > 0 && remaining <= 0;
  }

  formatInvestorName(record: InvestmentRecord): string {
    const u = record.investorUser;
    return [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.username || '-';
  }

  packageStatusPillClass(status: string | null | undefined): string {
    return packageStatusBadgeClass(status);
  }

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
