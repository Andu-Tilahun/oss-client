import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {forkJoin, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {InvestmentPackageService} from '../investment-package/services/investment-package.service';
import {InvestmentPackage, InvestmentRecord} from '../investment-package/models/investment-package.model';
import {FarmLeaseService} from '../farm-leases/services/farm-lease.service';
import {LeaseAgreement} from '../farm-leases/models/farm-lease.model';
import {PageResponse} from '../../shared/models/api-response.model';

interface MoneyBarRow {
  label: string;
  amount: number;
  pct: number;
}

interface TrendPoint {
  label: string;
  amount: number;
  pct: number;
}

/** Single slice for investment selection pie (lease / bid / crowd). */
interface InvestmentSelectionSlice {
  key: 'lease' | 'bid' | 'crowd';
  label: string;
  amount: number;
  /** Share of total (0–100) for legend. */
  sharePct: number;
  color: string;
}

@Component({
  selector: 'app-investor-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './investor-home.component.html',
})
export class InvestorHomeComponent implements OnInit {
  loading = true;
  greeting = '';

  recentLeases: LeaseAgreement[] = [];
  campaigns: InvestmentPackage[] = [];

  /** Sum of lease contract value for “in play” statuses (excludes terminated). */
  totalLeaseCommitted = 0;
  /** Sum of crowdfunding amounts for non-rejected / non-failed. */
  totalCrowdDeployed = 0;
  /** Combined capital you have at work. */
  totalAtWork = 0;
  /** Share of at-work capital: leases (0–100). */
  allocationLeasePct = 0;
  /** Share of at-work capital: crowdfunding (0–100). */
  allocationCrowdPct = 0;

  leaseCapitalByStatus: MoneyBarRow[] = [];
  leaseMonthlyTrend: TrendPoint[] = [];

  /** Mutually exclusive: live leases | pending bids | active crowd deployments. */
  selectionLease = 0;
  selectionBid = 0;
  selectionCrowd = 0;

  /** Parsed weighted expected return on crowd slice (informational). */
  crowdWeightedRoiPct: number | null = null;

  readonly newsItems = [
    {
      date: 'May 2026',
      title: 'Lease workflow updates',
      body: 'Track pending and active farm leases from My farm leases; open a plot on smaller screens for quick actions.',
    },
    {
      date: 'May 2026',
      title: 'Investment Package campaigns',
      body: 'Review open campaigns and your investments from the Farm menu whenever you are ready to deploy capital.',
    },
    {
      date: 'May 2026',
      title: 'Plot discovery',
      body: 'Browse active listings from Farm → explore plots to compare opportunities before you commit.',
    },
  ];

  constructor(
    private investmentPackageService: InvestmentPackageService,
    private farmLeaseService: FarmLeaseService
  ) {}

  ngOnInit(): void {
    this.setGreeting();
    this.loadDashboard();
  }

  campaignUrgencyPct(c: InvestmentPackage): number {
    if (!c.fundingDeadline) return 40;
    const end = new Date(c.fundingDeadline).getTime();
    const now = Date.now();
    if (!Number.isFinite(end)) return 40;
    const days = Math.max(0, (end - now) / (86400000));
    return Math.min(100, Math.max(8, Math.round(100 - Math.min(days, 90) * (100 / 90))));
  }

  formatMoney(n: number | undefined): string {
    if (n === undefined || n === null) return '—';
    return new Intl.NumberFormat(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0}).format(n);
  }

  get selectionPieTotal(): number {
    return this.selectionLease + this.selectionBid + this.selectionCrowd;
  }

  investmentSelectionSlices(): InvestmentSelectionSlice[] {
    const t = this.selectionPieTotal;
    if (t <= 0) return [];
    const pct = (a: number) => Math.round((a / t) * 1000) / 10;
    const rows: InvestmentSelectionSlice[] = [
      {key: 'lease', label: 'Lease', amount: this.selectionLease, sharePct: pct(this.selectionLease), color: '#4f46e5'},
      {key: 'bid', label: 'Bid', amount: this.selectionBid, sharePct: pct(this.selectionBid), color: '#d97706'},
      {key: 'crowd', label: 'Crowd', amount: this.selectionCrowd, sharePct: pct(this.selectionCrowd), color: '#059669'},
    ];
    return rows.filter((s) => s.amount > 0);
  }

  investmentSelectionPieBackground(): string {
    const segments = [
      {amount: this.selectionLease, color: '#4f46e5'},
      {amount: this.selectionBid, color: '#d97706'},
      {amount: this.selectionCrowd, color: '#059669'},
    ].filter((s) => s.amount > 0);
    const t = segments.reduce((a, s) => a + s.amount, 0);
    if (t <= 0) {
      return 'conic-gradient(from -90deg, #e2e8f0 0deg 360deg)';
    }
    let acc = 0;
    const parts: string[] = [];
    for (const s of segments) {
      const startDeg = (acc / t) * 360;
      acc += s.amount;
      const endDeg = (acc / t) * 360;
      parts.push(`${s.color} ${startDeg}deg ${endDeg}deg`);
    }
    return `conic-gradient(from -90deg, ${parts.join(', ')})`;
  }

  formatMoneyCompact(n: number): string {
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return this.formatMoney(n);
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
      campaigns: this.investmentPackageService
        .filterInvestmentPackages({
          statuses: ['OPEN'],
          sortBy: 'fundingDeadline',
          sortDirection: 'ASC',
          page: 0,
          size: 12,
        })
        .pipe(catchError(() => of(this.emptyPage<InvestmentPackage>()))),
      leases: this.farmLeaseService
        .filterLeases({
          sortBy: 'startDate',
          sortDirection: 'DESC',
          page: 0,
          size: 120,
        })
        .pipe(catchError(() => of(this.emptyPage<LeaseAgreement>()))),
      investments: this.investmentPackageService
        .filterInvestments({
          sortBy: 'startDate',
          sortDirection: 'DESC',
          page: 0,
          size: 120,
        })
        .pipe(catchError(() => of(this.emptyPage<InvestmentRecord>()))),
    }).subscribe({
      next: ({campaigns, leases, investments}) => {
        const leaseList = leases.content ?? [];
        const invList = investments.content ?? [];

        this.recentLeases = leaseList.slice(0, 8);
        this.campaigns = campaigns.content ?? [];

        const leaseCommittedStatuses = new Set(['ACTIVE', 'ACCEPTED', 'SENT', 'PENDING', 'OPEN', 'FUNDED']);
        this.totalLeaseCommitted = leaseList
          .filter((l) => leaseCommittedStatuses.has(l.status ?? l.fundingStatus ?? ''))
          .reduce((s, l) => s + (l.totalAmount ?? l.targetAmount ?? 0), 0);

        const crowdCountStatuses = new Set([
          'ACTIVE',
          'SENT',
          'PAID',
          'ACCEPTED',
          'PENDING',
        ]);
        this.totalCrowdDeployed = invList
          .filter((i) => crowdCountStatuses.has(i.status))
          .reduce((s, i) => s + (i.amount ?? 0), 0);

        this.totalAtWork = this.totalLeaseCommitted + this.totalCrowdDeployed;
        if (this.totalAtWork > 0) {
          this.allocationLeasePct = Math.round((this.totalLeaseCommitted / this.totalAtWork) * 100);
          this.allocationCrowdPct = 100 - this.allocationLeasePct;
        } else {
          this.allocationLeasePct = 0;
          this.allocationCrowdPct = 0;
        }

        this.leaseCapitalByStatus = this.toMoneyBars(
          this.sumBy(leaseList, (l) => l.status ?? l.fundingStatus ?? '-', (l) => l.totalAmount ?? l.targetAmount ?? 0),
        );
        this.computeInvestmentSelectionSlices(leaseList, invList);
        this.leaseMonthlyTrend = this.buildLeaseMonthlyTrend(leaseList);
        this.crowdWeightedRoiPct = this.weightedCrowdRoi(invList);

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  /**
   * Lease = signed/live pipeline (no pending).
   * Bid = pending lease applications + pending crowd commitments.
   * Crowd = funded/active crowd positions (non-pending).
   */
  private computeInvestmentSelectionSlices(leaseList: LeaseAgreement[], invList: InvestmentRecord[]): void {
    const liveLease = new Set(['ACTIVE', 'ACCEPTED', 'SENT', 'FUNDED']);
    this.selectionLease = leaseList
      .filter((l) => liveLease.has(l.status ?? l.fundingStatus ?? ''))
      .reduce((s, l) => s + (l.totalAmount ?? l.targetAmount ?? 0), 0);

    this.selectionBid =
      leaseList.filter((l) => (l.status ?? '') === 'PENDING').reduce((s, l) => s + (l.totalAmount ?? l.targetAmount ?? 0), 0) +
      invList.filter((i) => i.status === 'PENDING').reduce((s, i) => s + (i.amount ?? 0), 0);

    const crowdLive = new Set(['ACTIVE', 'SENT', 'PAID', 'ACCEPTED']);
    this.selectionCrowd = invList
      .filter((i) => crowdLive.has(i.status))
      .reduce((s, i) => s + (i.amount ?? 0), 0);
  }

  private sumBy<T>(
    rows: T[],
    keyFn: (row: T) => string,
    valFn: (row: T) => number
  ): Record<string, number> {
    const out: Record<string, number> = {};
    for (const row of rows) {
      const k = keyFn(row);
      out[k] = (out[k] ?? 0) + valFn(row);
    }
    return out;
  }

  private toMoneyBars(amounts: Record<string, number>): MoneyBarRow[] {
    const entries = Object.entries(amounts).filter(([, v]) => v > 0);
    if (entries.length === 0) return [];
    const max = Math.max(...entries.map(([, v]) => v), 1);
    return entries
      .map(([label, amount]) => ({
        label,
        amount,
        pct: Math.round((amount / max) * 100),
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  /** Last 6 months: sum of lease contract value by start month. */
  private buildLeaseMonthlyTrend(leases: LeaseAgreement[]): TrendPoint[] {
    const now = new Date();
    const months: { key: string; label: string; start: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString(undefined, {month: 'short', year: '2-digit'});
      months.push({key, label, start: d});
    }
    const sums: Record<string, number> = {};
    for (const m of months) sums[m.key] = 0;

    for (const l of leases) {
      if (!l.startDate) continue;
      const sd = new Date(l.startDate);
      if (!Number.isFinite(sd.getTime())) continue;
      const key = `${sd.getFullYear()}-${String(sd.getMonth() + 1).padStart(2, '0')}`;
      if (sums[key] !== undefined) {
        sums[key] += l.totalAmount ?? 0;
      }
    }

    const amounts = months.map((m) => sums[m.key] ?? 0);
    const max = Math.max(...amounts, 1);
    return months.map((m, idx) => ({
      label: m.label,
      amount: amounts[idx],
      pct: Math.round((amounts[idx] / max) * 100),
    }));
  }

  private weightedCrowdRoi(investments: InvestmentRecord[]): number | null {
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

  private emptyPage<T>(): PageResponse<T> {
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 0,
      number: 0,
      first: true,
      last: true,
    };
  }
}
