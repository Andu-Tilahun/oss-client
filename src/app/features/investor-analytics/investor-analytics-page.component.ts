import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {forkJoin, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {NgxEchartsDirective} from 'ngx-echarts';
import type {EChartsOption} from 'echarts';
import {MapLocation, OssMapComponent} from '../../shared/oss-map/oss-map.component';
import {InvestmentPackageService} from '../investment-package/services/investment-package.service';
import {
  InvestmentAgreement,
  InvestmentPackage,
  InvestmentPackageStatusSummary,
  InvestmentRecord,
} from '../investment-package/models/investment-package.model';
import {FundingStatus} from '../../shared/models/funding-status.model';
import {PageResponse} from '../../shared/models/api-response.model';
import {RegionService} from '../regions/services/region.service';
import {Region} from '../regions/models/region.model';

interface CountSlice {
  label: string;
  value: number;
  color: string;
}

interface LabeledValue {
  label: string;
  value: number;
}

/** Committed/live money — same definition used on the basic investor dashboard. */
const DEPLOYED_STATUSES = new Set(['PAID', 'ACTIVE', 'ACCEPTED', 'SENT']);

const AGREEMENT_STATUS_ORDER = ['PENDING', 'SENT', 'ACCEPTED', 'ACTIVE', 'TERMINATED', 'REJECTED', 'CANCELED'];
const ALL_AGREEMENT_STATUSES = AGREEMENT_STATUS_ORDER as ('ACTIVE' | 'PENDING' | 'TERMINATED' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CANCELED')[];

const FARM_ACTIVITY_COLORS: Record<string, string> = {
  CROPS: '#22C55E',
  LIVE_STOCKS: '#D97706',
  AGRO_FORESTRY: '#0EA5E9',
};

const PACKAGE_TYPE_COLORS: Record<string, string> = {
  LEASING: '#10B981',
  BIDDING: '#D97706',
  CROWDFUNDING: '#4F46E5',
};

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  CREDIT: '#4F46E5',
  BANK_TRANSFER: '#0EA5E9',
  CRYPTO: '#D97706',
};

const FUNDING_STATUS_COLORS: Record<string, string> = {
  OPEN: '#22C55E',
  CLOSED: '#94A3B8',
  FUNDED: '#4F46E5',
  FAILED: '#EF4444',
};

const PACKAGE_STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#22C55E',
  INACTIVE: '#94A3B8',
  IN_USE: '#0EA5E9',
  COMPLITED: '#4F46E5',
};

const CONTRIBUTION_TIERS: {label: string; max: number}[] = [
  {label: '<1K', max: 1_000},
  {label: '1K–5K', max: 5_000},
  {label: '5K–20K', max: 20_000},
  {label: '20K–100K', max: 100_000},
  {label: '100K+', max: Infinity},
];

@Component({
  selector: 'app-investor-analytics-page',
  standalone: true,
  imports: [CommonModule, RouterModule, NgxEchartsDirective, OssMapComponent],
  templateUrl: './investor-analytics-page.component.html',
})
export class InvestorAnalyticsPageComponent implements OnInit {
  loading = true;

  // ---- My Portfolio Detail ----
  farmActivityBreakdown: CountSlice[] = [];
  regionBreakdown: LabeledValue[] = [];
  paymentMethodBreakdown: CountSlice[] = [];
  agreementStatusFunnel: CountSlice[] = [];
  upcomingAgreementEndDates: (LabeledValue & {daysRemaining: number})[] = [];
  roiByPackage: LabeledValue[] = [];

  farmActivityChartOption: EChartsOption = {};
  regionChartOption: EChartsOption = {};
  paymentMethodChartOption: EChartsOption = {};
  agreementFunnelChartOption: EChartsOption = {};
  upcomingEndDatesChartOption: EChartsOption = {};
  roiByPackageChartOption: EChartsOption = {};

  // ---- Market Insights ----
  deadlineUrgency: (LabeledValue & {daysRemaining: number})[] = [];
  openByPackageType: CountSlice[] = [];
  openByFarmActivity: CountSlice[] = [];
  contributionTiers: LabeledValue[] = [];
  crowdfundingFillRate: (LabeledValue & {expected: number; investorCount: number})[] = [];
  platformFundingOutcomes: CountSlice[] = [];
  platformLifecycleStatus: CountSlice[] = [];
  soilWaterMatrix: {soilType: string; IRRIGATION: number; RIVER_ACCESS: number; RAIN_FED: number}[] = [];
  openPackageLocations: MapLocation[] = [];

  deadlineUrgencyChartOption: EChartsOption = {};
  openByPackageTypeChartOption: EChartsOption = {};
  openByFarmActivityChartOption: EChartsOption = {};
  contributionTiersChartOption: EChartsOption = {};
  crowdfundingFillRateChartOption: EChartsOption = {};
  platformFundingOutcomesChartOption: EChartsOption = {};
  platformLifecycleStatusChartOption: EChartsOption = {};
  soilWaterChartOption: EChartsOption = {};

  constructor(
    private investmentPackageService: InvestmentPackageService,
    private regionService: RegionService,
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  formatMoney(n: number | undefined | null): string {
    if (n === undefined || n === null) return '—';
    return new Intl.NumberFormat(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0}).format(n);
  }

  onMapMarkerClicked(): void {
    // No per-package deep-link route exists today; land on the browse-packages page.
  }

  private loadDashboard(): void {
    this.loading = true;
    forkJoin({
      investments: this.investmentPackageService
        .filterInvestments({page: 0, size: 500})
        .pipe(catchError(() => of(this.emptyPage<InvestmentRecord>()))),
      agreements: this.investmentPackageService
        .filterAgreements({statuses: ALL_AGREEMENT_STATUSES, page: 0, size: 300})
        .pipe(catchError(() => of(this.emptyPage<InvestmentAgreement>()))),
      openPackages: this.investmentPackageService
        .filterInvestmentPackages({statuses: [FundingStatus.OPEN], page: 0, size: 500})
        .pipe(catchError(() => of(this.emptyPage<InvestmentPackage>()))),
      regions: this.regionService.filterRegions({page: 0, size: 200}).pipe(catchError(() => of(this.emptyPage<Region>()))),
      statusSummary: this.investmentPackageService
        .getStatusSummary()
        .pipe(catchError(() => of({fundingStatusCounts: {}, packageStatusCounts: {}} as InvestmentPackageStatusSummary))),
    }).subscribe(({investments, agreements, openPackages, regions, statusSummary}) => {
      const invList = investments.content ?? [];
      const agreementList = agreements.content ?? [];
      const openList = openPackages.content ?? [];
      const regionNameById = new Map(regions.content?.map((r) => [r.id, r.name]) ?? []);

      this.computePortfolioDetail(invList, agreementList, regionNameById);
      this.computeMarketInsights(openList, statusSummary);
      this.buildChartOptions();
      this.loading = false;
    });
  }

  // ==================== My Portfolio Detail ====================

  private computePortfolioDetail(
    investments: InvestmentRecord[],
    agreements: InvestmentAgreement[],
    regionNameById: Map<string, string>,
  ): void {
    const deployed = investments.filter((i) => DEPLOYED_STATUSES.has(i.status));

    this.farmActivityBreakdown = this.toSlices(
      this.sumAmountBy(deployed, (i) => i.investmentPackage?.farmActivity ?? 'UNKNOWN'),
      FARM_ACTIVITY_COLORS,
    );

    this.regionBreakdown = Object.entries(
      this.sumAmountBy(deployed, (i) => i.investmentPackage?.farmPlot?.regionId ?? 'UNKNOWN'),
    )
      .map(([regionId, value]) => ({label: regionNameById.get(regionId) ?? 'Unknown region', value}))
      .sort((a, b) => b.value - a.value);

    this.paymentMethodBreakdown = this.toSlices(this.sumAmountBy(deployed, (i) => i.paymentMethod), PAYMENT_METHOD_COLORS);

    const agreementCounts = this.sumCountBy(agreements, (a) => a.status);
    this.agreementStatusFunnel = AGREEMENT_STATUS_ORDER.map((status) => ({
      label: this.titleCase(status),
      value: agreementCounts[status] ?? 0,
      color: this.agreementStatusColor(status),
    }));

    this.upcomingAgreementEndDates = agreements
      .filter((a) => a.status === 'ACTIVE' && !!a.endDate)
      .map((a) => ({
        label: a.farmPlot?.title ?? 'Farm plot',
        value: a.totalAmount ?? 0,
        daysRemaining: this.daysRemaining(a.endDate),
      }))
      .filter((a): a is LabeledValue & {daysRemaining: number} => a.daysRemaining !== null)
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 8);

    this.roiByPackage = investments
      .map((i) => ({label: i.investmentPackage?.title ?? 'Package', value: this.parseRoiPercent(i.roi)}))
      .filter((r): r is LabeledValue => r.value !== null)
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
  }

  // ==================== Market Insights ====================

  private computeMarketInsights(openPackages: InvestmentPackage[], statusSummary: InvestmentPackageStatusSummary): void {
    this.deadlineUrgency = openPackages
      .map((p) => ({label: p.title, value: p.targetAmount ?? 0, daysRemaining: this.daysRemaining(p.fundingDeadline)}))
      .filter((p): p is LabeledValue & {daysRemaining: number} => p.daysRemaining !== null)
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 12);

    this.openByPackageType = this.toSlices(this.sumCountBy(openPackages, (p) => p.investmentPackageType ?? 'UNKNOWN'), PACKAGE_TYPE_COLORS);
    this.openByFarmActivity = this.toSlices(this.sumCountBy(openPackages, (p) => p.farmActivity ?? 'UNKNOWN'), FARM_ACTIVITY_COLORS);

    const tierCounts = CONTRIBUTION_TIERS.map((tier) => ({label: tier.label, value: 0}));
    for (const p of openPackages) {
      const amount = p.minimumContribution ?? 0;
      const idx = CONTRIBUTION_TIERS.findIndex((t) => amount < t.max);
      tierCounts[idx === -1 ? tierCounts.length - 1 : idx].value++;
    }
    this.contributionTiers = tierCounts;

    this.crowdfundingFillRate = openPackages
      .filter((p) => p.investmentPackageType === 'CROWDFUNDING')
      .map((p) => {
        const investorCount = p.investorIdList?.length ?? 0;
        const expected = p.expectedInvestorNumber ?? 0;
        return {
          label: p.title,
          value: expected > 0 ? Math.round((investorCount / expected) * 100) : 0,
          investorCount,
          expected,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);

    this.platformFundingOutcomes = Object.entries(statusSummary.fundingStatusCounts ?? {}).map(([status, value]) => ({
      label: this.titleCase(status),
      value,
      color: FUNDING_STATUS_COLORS[status] ?? '#CBD5E1',
    }));
    this.platformLifecycleStatus = Object.entries(statusSummary.packageStatusCounts ?? {}).map(([status, value]) => ({
      label: this.titleCase(status),
      value,
      color: PACKAGE_STATUS_COLORS[status] ?? '#CBD5E1',
    }));

    const soilTypes = ['SANDY', 'CLAY', 'LOAMY'];
    this.soilWaterMatrix = soilTypes.map((soilType) => {
      const plots = openPackages.filter((p) => p.farmPlot?.soilType === soilType);
      return {
        soilType: this.titleCase(soilType),
        IRRIGATION: plots.filter((p) => p.waterSource === 'IRRIGATION').length,
        RIVER_ACCESS: plots.filter((p) => p.waterSource === 'RIVER_ACCESS').length,
        RAIN_FED: plots.filter((p) => p.waterSource === 'RAIN_FED').length,
      };
    });

    this.openPackageLocations = openPackages
      .filter((p) => p.farmPlot?.latitude != null && p.farmPlot?.longitude != null)
      .map((p) => ({
        lat: p.farmPlot.latitude!,
        lng: p.farmPlot.longitude!,
        name: p.title,
        description: `${this.titleCase(p.investmentPackageType ?? '')} · Target ${this.formatMoney(p.targetAmount)}`,
      }));
  }

  // ==================== Chart option builders ====================

  private buildChartOptions(): void {
    this.farmActivityChartOption = this.donutOption(this.farmActivityBreakdown);
    this.paymentMethodChartOption = this.donutOption(this.paymentMethodBreakdown);
    this.agreementFunnelChartOption = this.horizontalBarOption(this.agreementStatusFunnel);
    this.openByPackageTypeChartOption = this.donutOption(this.openByPackageType);
    this.openByFarmActivityChartOption = this.donutOption(this.openByFarmActivity);
    this.platformFundingOutcomesChartOption = this.donutOption(this.platformFundingOutcomes);
    this.platformLifecycleStatusChartOption = this.donutOption(this.platformLifecycleStatus);

    this.regionChartOption = {
      tooltip: {trigger: 'axis', valueFormatter: (v) => this.formatMoney(v as number)},
      grid: {left: 110, right: 20, top: 20, bottom: 20, containLabel: true},
      xAxis: {type: 'value'},
      yAxis: {type: 'category', data: this.regionBreakdown.map((r) => r.label)},
      series: [{type: 'bar', itemStyle: {color: '#4F46E5'}, data: this.regionBreakdown.map((r) => r.value)}],
    };

    this.upcomingEndDatesChartOption = {
      tooltip: {trigger: 'axis', formatter: (params) => {
        const p = Array.isArray(params) ? params[0] : params;
        const row = this.upcomingAgreementEndDates[p.dataIndex as number];
        return row ? `${p.name}<br/>${row.daysRemaining} days remaining` : '';
      }},
      grid: {left: 110, right: 20, top: 20, bottom: 20, containLabel: true},
      xAxis: {type: 'value', name: 'Days remaining'},
      yAxis: {type: 'category', data: this.upcomingAgreementEndDates.map((a) => a.label)},
      series: [{type: 'bar', itemStyle: {color: '#F59E0B'}, data: this.upcomingAgreementEndDates.map((a) => a.daysRemaining)}],
    };

    this.roiByPackageChartOption = {
      tooltip: {trigger: 'axis', valueFormatter: (v) => `${v}%`},
      grid: {left: 130, right: 20, top: 20, bottom: 20, containLabel: true},
      xAxis: {type: 'value', name: 'ROI %'},
      yAxis: {type: 'category', data: this.roiByPackage.map((r) => r.label)},
      series: [{type: 'bar', itemStyle: {color: '#16A34A'}, data: this.roiByPackage.map((r) => r.value)}],
    };

    this.deadlineUrgencyChartOption = {
      tooltip: {trigger: 'axis', formatter: (params) => {
        const p = Array.isArray(params) ? params[0] : params;
        const row = this.deadlineUrgency[p.dataIndex as number];
        return row ? `${p.name}<br/>${row.daysRemaining} days left · target ${this.formatMoney(row.value)}` : '';
      }},
      grid: {left: 130, right: 20, top: 20, bottom: 20, containLabel: true},
      xAxis: {type: 'value', name: 'Days left'},
      yAxis: {type: 'category', data: this.deadlineUrgency.map((d) => d.label)},
      series: [{type: 'bar', itemStyle: {color: '#EF4444'}, data: this.deadlineUrgency.map((d) => d.daysRemaining)}],
    };

    this.contributionTiersChartOption = {
      tooltip: {trigger: 'axis'},
      grid: {left: 40, right: 20, top: 20, bottom: 30, containLabel: true},
      xAxis: {type: 'category', data: this.contributionTiers.map((t) => t.label)},
      yAxis: {type: 'value', minInterval: 1},
      series: [{type: 'bar', itemStyle: {color: '#0EA5E9'}, data: this.contributionTiers.map((t) => t.value)}],
    };

    this.crowdfundingFillRateChartOption = {
      tooltip: {trigger: 'axis', formatter: (params) => {
        const p = Array.isArray(params) ? params[0] : params;
        const row = this.crowdfundingFillRate[p.dataIndex as number];
        return row ? `${p.name}<br/>${row.investorCount} of ${row.expected} investors (${row.value}%)` : '';
      }},
      grid: {left: 130, right: 20, top: 20, bottom: 20, containLabel: true},
      xAxis: {type: 'value', name: 'Fill %', max: 100},
      yAxis: {type: 'category', data: this.crowdfundingFillRate.map((r) => r.label)},
      series: [{type: 'bar', itemStyle: {color: '#4F46E5'}, data: this.crowdfundingFillRate.map((r) => r.value)}],
    };

    this.soilWaterChartOption = {
      tooltip: {trigger: 'axis'},
      legend: {data: ['Irrigation', 'River Access', 'Rain Fed'], bottom: 0},
      grid: {left: 40, right: 20, top: 20, bottom: 40, containLabel: true},
      xAxis: {type: 'category', data: this.soilWaterMatrix.map((s) => s.soilType)},
      yAxis: {type: 'value', minInterval: 1},
      series: [
        {name: 'Irrigation', type: 'bar', itemStyle: {color: '#0EA5E9'}, data: this.soilWaterMatrix.map((s) => s.IRRIGATION)},
        {name: 'River Access', type: 'bar', itemStyle: {color: '#22C55E'}, data: this.soilWaterMatrix.map((s) => s.RIVER_ACCESS)},
        {name: 'Rain Fed', type: 'bar', itemStyle: {color: '#D97706'}, data: this.soilWaterMatrix.map((s) => s.RAIN_FED)},
      ],
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

  private horizontalBarOption(slices: CountSlice[]): EChartsOption {
    return {
      tooltip: {trigger: 'axis'},
      grid: {left: 100, right: 20, top: 20, bottom: 20, containLabel: true},
      xAxis: {type: 'value', minInterval: 1},
      yAxis: {type: 'category', data: slices.map((s) => s.label)},
      series: [{type: 'bar', data: slices.map((s) => ({value: s.value, itemStyle: {color: s.color}}))}],
    };
  }

  // ==================== Helpers ====================

  private toSlices(amounts: Record<string, number>, colors: Record<string, string>): CountSlice[] {
    return Object.entries(amounts)
      .map(([key, value]) => ({label: this.titleCase(key), value, color: colors[key] ?? '#CBD5E1'}))
      .sort((a, b) => b.value - a.value);
  }

  private sumAmountBy(rows: InvestmentRecord[], keyFn: (row: InvestmentRecord) => string): Record<string, number> {
    const out: Record<string, number> = {};
    for (const row of rows) {
      const k = keyFn(row);
      out[k] = (out[k] ?? 0) + (row.amount ?? 0);
    }
    return out;
  }

  private sumCountBy<T>(rows: T[], keyFn: (row: T) => string): Record<string, number> {
    const out: Record<string, number> = {};
    for (const row of rows) {
      const k = keyFn(row);
      out[k] = (out[k] ?? 0) + 1;
    }
    return out;
  }

  private agreementStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return '#22C55E';
      case 'PENDING':
        return '#F59E0B';
      case 'SENT':
        return '#0EA5E9';
      case 'ACCEPTED':
        return '#4F46E5';
      case 'TERMINATED':
        return '#94A3B8';
      case 'REJECTED':
        return '#EF4444';
      case 'CANCELED':
        return '#DC2626';
      default:
        return '#CBD5E1';
    }
  }

  private daysRemaining(dateStr: string | undefined | null): number | null {
    if (!dateStr) return null;
    const d = new Date(dateStr).getTime();
    if (!Number.isFinite(d)) return null;
    return Math.max(0, Math.round((d - Date.now()) / 86400000));
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
