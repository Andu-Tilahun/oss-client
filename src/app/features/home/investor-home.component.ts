import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {forkJoin, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {NgxEchartsDirective} from 'ngx-echarts';
import type {EChartsOption} from 'echarts';
import {InvestmentPackageService} from '../investment-package/services/investment-package.service';
import {InvestmentPackage, InvestmentRecord} from '../investment-package/models/investment-package.model';
import {FundingStatus} from '../../shared/models/funding-status.model';
import {PageResponse} from '../../shared/models/api-response.model';

interface CountSlice {
  label: string;
  value: number;
  color: string;
}

interface MonthPoint {
  label: string;
  count: number;
  amount: number;
}

interface TrendPoint {
  label: string;
  cumulative: number;
}

/** Committed/live money: excludes PENDING (not yet committed) and REJECTED/CANCELED/BACKUP (dead). */
const DEPLOYED_STATUSES = new Set(['PAID', 'ACTIVE', 'ACCEPTED', 'SENT']);

const STATUS_COLORS: Record<string, string> = {
  PAID: '#16A34A',
  ACTIVE: '#22C55E',
  PENDING: '#F59E0B',
  SENT: '#0EA5E9',
  ACCEPTED: '#4F46E5',
  REJECTED: '#EF4444',
  CANCELED: '#94A3B8',
  BACKUP: '#A855F7',
  FAILED: '#DC2626',
};

const PACKAGE_TYPE_COLORS: Record<string, string> = {
  LEASING: '#10B981',
  BIDDING: '#D97706',
  CROWDFUNDING: '#4F46E5',
};

@Component({
  selector: 'app-investor-home',
  standalone: true,
  imports: [CommonModule, RouterModule, NgxEchartsDirective],
  templateUrl: './investor-home.component.html',
})
export class InvestorHomeComponent implements OnInit {
  loading = true;
  greeting = '';

  campaigns: InvestmentPackage[] = [];

  totalDeployedCapital = 0;
  activeInvestmentsCount = 0;
  blendedRoiPct: number | null = null;
  openOpportunitiesCount = 0;

  statusBreakdown: CountSlice[] = [];
  packageTypeBreakdown: CountSlice[] = [];
  portfolioTrend: TrendPoint[] = [];
  monthlyActivity: MonthPoint[] = [];

  portfolioValueChartOption: EChartsOption = {};
  statusBreakdownChartOption: EChartsOption = {};
  packageTypeChartOption: EChartsOption = {};
  monthlyActivityChartOption: EChartsOption = {};

  constructor(private investmentPackageService: InvestmentPackageService) {}

  ngOnInit(): void {
    this.setGreeting();
    this.loadDashboard();
  }

  campaignUrgencyPct(c: InvestmentPackage): number {
    if (!c.fundingDeadline) return 40;
    const end = new Date(c.fundingDeadline).getTime();
    const now = Date.now();
    if (!Number.isFinite(end)) return 40;
    const days = Math.max(0, (end - now) / 86400000);
    return Math.min(100, Math.max(8, Math.round(100 - Math.min(days, 90) * (100 / 90))));
  }

  formatMoney(n: number | undefined | null): string {
    if (n === undefined || n === null) return '—';
    return new Intl.NumberFormat(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0}).format(n);
  }

  /** Abbreviated form (e.g. 18,000,000,000 -> "18B") for tight tile/axis space on narrow screens. */
  formatCompactMoney(n: number | undefined | null): string {
    if (n === undefined || n === null) return '—';
    return new Intl.NumberFormat(undefined, {notation: 'compact', maximumFractionDigits: 1}).format(n);
  }

  private setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) this.greeting = 'Good morning';
    else if (hour < 18) this.greeting = 'Good afternoon';
    else this.greeting = 'Good evening';
  }

  private loadDashboard(): void {
    this.loading = true;
    forkJoin({
      // No sortBy: filterInvestments' backend sort whitelist doesn't include the entity's
      // actual createdDate/modifiedDate field names and 500s if given one — sort client-side.
      investments: this.investmentPackageService
        .filterInvestments({page: 0, size: 500})
        .pipe(catchError(() => of(this.emptyPage<InvestmentRecord>()))),
      campaigns: this.investmentPackageService
        .filterPublishedInvestmentPackages({statuses: [FundingStatus.OPEN], sortBy: 'fundingDeadline', sortDirection: 'ASC', page: 0, size: 12})
        .pipe(catchError(() => of(this.emptyPage<InvestmentPackage>()))),
      openCount: this.investmentPackageService
        .filterPublishedInvestmentPackages({statuses: [FundingStatus.OPEN], page: 0, size: 1})
        .pipe(
          map((r) => r.totalElements ?? 0),
          catchError(() => of(0)),
        ),
    }).subscribe({
      next: ({investments, campaigns, openCount}) => {
        const invList = investments.content ?? [];
        this.campaigns = campaigns.content ?? [];
        this.openOpportunitiesCount = openCount;

        this.computeDashboard(invList);
        this.buildChartOptions();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private computeDashboard(investments: InvestmentRecord[]): void {
    const deployed = investments.filter((i) => DEPLOYED_STATUSES.has(i.status));

    this.totalDeployedCapital = deployed.reduce((s, i) => s + (i.amount ?? 0), 0);
    this.activeInvestmentsCount = deployed.length;
    this.blendedRoiPct = this.weightedRoi(investments);

    this.statusBreakdown = Object.entries(this.sumCountBy(investments, (i) => i.status))
      .map(([status, value]) => ({label: this.titleCase(status), value, color: STATUS_COLORS[status] ?? '#CBD5E1'}))
      .sort((a, b) => b.value - a.value);

    this.packageTypeBreakdown = Object.entries(
      this.sumAmountBy(deployed, (i) => i.investmentPackage?.investmentPackageType ?? 'UNKNOWN'),
    )
      .map(([type, value]) => ({label: this.titleCase(type), value, color: PACKAGE_TYPE_COLORS[type] ?? '#CBD5E1'}))
      .sort((a, b) => b.value - a.value);

    this.portfolioTrend = this.buildPortfolioTrend(deployed);
    this.monthlyActivity = this.buildMonthlyActivity(investments);
  }

  private buildChartOptions(): void {
    this.statusBreakdownChartOption = this.donutOption(this.statusBreakdown);
    this.packageTypeChartOption = this.donutOption(this.packageTypeBreakdown);

    this.portfolioValueChartOption = {
      tooltip: {trigger: 'axis', valueFormatter: (v) => this.formatMoney(v as number)},
      grid: {left: 10, right: 16, top: 20, bottom: 30, containLabel: true},
      xAxis: {type: 'category', data: this.portfolioTrend.map((p) => p.label)},
      yAxis: {type: 'value', axisLabel: {formatter: (v: number) => this.formatCompactMoney(v)}},
      series: [
        {
          type: 'line',
          smooth: true,
          itemStyle: {color: '#4F46E5'},
          areaStyle: {color: 'rgba(79,70,229,0.08)'},
          data: this.portfolioTrend.map((p) => p.cumulative),
        },
      ],
    };

    this.monthlyActivityChartOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const p = Array.isArray(params) ? params[0] : params;
          const point = this.monthlyActivity[p.dataIndex as number];
          if (!point) return '';
          return `${p.name}<br/>${this.formatMoney(point.amount)} · ${point.count} investment${point.count === 1 ? '' : 's'}`;
        },
      },
      grid: {left: 10, right: 16, top: 20, bottom: 30, containLabel: true},
      xAxis: {type: 'category', data: this.monthlyActivity.map((m) => m.label)},
      yAxis: {type: 'value', axisLabel: {formatter: (v: number) => this.formatCompactMoney(v)}},
      series: [{type: 'bar', itemStyle: {color: '#4F46E5'}, data: this.monthlyActivity.map((m) => m.amount)}],
    };
  }

  private donutOption(slices: CountSlice[]): EChartsOption {
    return {
      tooltip: {trigger: 'item', formatter: '{b}: {c} ({d}%)'},
      legend: {orient: 'horizontal', bottom: 0},
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '45%'],
          label: {show: false},
          emphasis: {label: {show: true, fontWeight: 'bold'}},
          data: slices.map((s) => ({name: s.label, value: s.value, itemStyle: {color: s.color}})),
        },
      ],
    };
  }

  private sumCountBy<T>(rows: T[], keyFn: (row: T) => string): Record<string, number> {
    const out: Record<string, number> = {};
    for (const row of rows) {
      const k = keyFn(row);
      out[k] = (out[k] ?? 0) + 1;
    }
    return out;
  }

  private sumAmountBy(rows: InvestmentRecord[], keyFn: (row: InvestmentRecord) => string): Record<string, number> {
    const out: Record<string, number> = {};
    for (const row of rows) {
      const k = keyFn(row);
      out[k] = (out[k] ?? 0) + (row.amount ?? 0);
    }
    return out;
  }

  /** Full history, monthly buckets, cumulative — not limited to a fixed recent window. */
  private buildPortfolioTrend(deployed: InvestmentRecord[]): TrendPoint[] {
    const withDates = deployed.filter((i) => !!i.createdAt);
    if (withDates.length === 0) return [];

    const monthSums = new Map<string, number>();
    for (const inv of withDates) {
      const d = new Date(inv.createdAt!);
      if (!Number.isFinite(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthSums.set(key, (monthSums.get(key) ?? 0) + (inv.amount ?? 0));
    }

    const months = [...monthSums.keys()].sort();
    let cumulative = 0;
    return months.map((key) => {
      cumulative += monthSums.get(key)!;
      const [y, m] = key.split('-').map(Number);
      const label = new Date(y, m - 1, 1).toLocaleString(undefined, {month: 'short', year: '2-digit'});
      return {label, cumulative};
    });
  }

  /** Last 6 months, count + amount of new investment records per month. */
  private buildMonthlyActivity(investments: InvestmentRecord[]): MonthPoint[] {
    const now = new Date();
    const months: {key: string; label: string}[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString(undefined, {month: 'short', year: '2-digit'}),
      });
    }

    const counts: Record<string, number> = {};
    const amounts: Record<string, number> = {};
    for (const m of months) {
      counts[m.key] = 0;
      amounts[m.key] = 0;
    }

    for (const inv of investments) {
      if (!inv.createdAt) continue;
      const d = new Date(inv.createdAt);
      if (!Number.isFinite(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (counts[key] === undefined) continue;
      counts[key]++;
      amounts[key] += inv.amount ?? 0;
    }

    return months.map((m) => ({label: m.label, count: counts[m.key], amount: amounts[m.key]}));
  }

  private weightedRoi(investments: InvestmentRecord[]): number | null {
    let num = 0;
    let den = 0;
    for (const i of investments) {
      const pct = this.parseRoiPercent(i.roi);
      if (pct === null) continue;
      const a = i.amount ?? 0;
      if (a <= 0) continue;
      num += a * pct;
      den += a;
    }
    if (den <= 0) return null;
    return Math.round((num / den) * 10) / 10;
  }

  private parseRoiPercent(roi: string | undefined): number | null {
    if (roi === undefined || roi === null) return null;
    const s = String(roi).trim();
    if (!s) return null;
    const withPct = s.endsWith('%') ? parseFloat(s.slice(0, -1)) : parseFloat(s);
    if (!Number.isFinite(withPct)) return null;
    if (withPct > 0 && withPct <= 1) return withPct * 100;
    return withPct;
  }

  private titleCase(s: string): string {
    return s
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  private emptyPage<T>(): PageResponse<T> {
    return {content: [], totalElements: 0, totalPages: 0, size: 0, number: 0, first: true, last: true};
  }
}
