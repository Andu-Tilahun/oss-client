import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { AuthService } from '../auth/services/auth.service';
import { User } from '../users/models/user.model';
import { FarmPlotService } from '../farm-plots/services/farm-plot.service';
import { InvestmentPackageService } from '../investment-package/services/investment-package.service';
import { UserService } from '../users/services/user.service';
import { PaymentService } from '../payments/services/payment.service';
import { FarmFollowUpService } from '../farm-followups/services/farm-followup.service';
import { FarmFollowUp } from '../farm-followups/models/farm-followup.model';
import { PageResponse } from '../../shared/models/api-response.model';
import { InvestmentPackage } from '../investment-package/models/investment-package.model';

interface CountSlice {
  label: string;
  value: number;
  color: string;
}

interface MonthlyFollowUpPattern {
  label: string;
  completed: number;
  pending: number;
  overdue: number;
}

interface NamedCount {
  label: string;
  value: number;
}

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, RouterModule, NgxEchartsDirective],
  templateUrl: './admin-home.component.html',
})
export class AdminHomeComponent implements OnInit {
  currentUser?: User;
  greeting = '';
  loading = true;

  totalFarmPlots = 0;
  totalInvestmentPackages = 0;
  totalUsers = 0;
  totalFollowUps = 0;
  totalPayments = 0;
  appliedInvestmentOptionsCount = 0;
  activeInvestmentOptionsCount = 0;
  farmPlotActiveCount = 0;
  farmPlotArchivedCount = 0;
  followUpActiveCount = 0;
  followUpDueSoonCount = 0;
  followUpTotalActiveCount = 0;

  farmPlotBreakdown: CountSlice[] = [];
  investmentPackageBreakdown: CountSlice[] = [];
  userRoleBreakdown: CountSlice[] = [];
  followUpTrend: MonthlyFollowUpPattern[] = [];
  farmPlotInvestmentBreakdown: NamedCount[] = [];

  farmPlotChartOption: EChartsOption = {};
  investmentPackageChartOption: EChartsOption = {};
  userRoleChartOption: EChartsOption = {};
  followUpTrendChartOption: EChartsOption = {};
  farmPlotInvestmentChartOption: EChartsOption = {};

  constructor(
    private authService: AuthService,
    private farmPlotService: FarmPlotService,
    private investmentPackageService: InvestmentPackageService,
    private userService: UserService,
    private paymentService: PaymentService,
    private farmFollowUpService: FarmFollowUpService,
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user || undefined;
    });
    this.setGreeting();
    this.loadDashboard();
  }

  private setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.greeting = 'Good Morning';
    } else if (hour < 18) {
      this.greeting = 'Good Afternoon';
    } else {
      this.greeting = 'Good Evening';
    }
  }

  private countOf<T>(obs: Observable<PageResponse<T>>): Observable<number> {
    return obs.pipe(
      map((r) => r?.totalElements ?? 0),
      catchError(() => of(0)),
    );
  }

  private loadDashboard(): void {
    this.loading = true;

    const farmPlots$ = forkJoin({
      operational: this.countOf(this.farmPlotService.filterOperationalFarmPlots({ page: 0, size: 1 })),
      repair: this.countOf(this.farmPlotService.filterRepairFarmPlots({ page: 0, size: 1 })),
      archived: this.countOf(this.farmPlotService.filterArchivedFarmPlots({ page: 0, size: 1 })),
    });

    const investmentPackages$ = forkJoin({
      LEASING: this.countOf(this.investmentPackageService.filterPublishedInvestmentPackages({ investmentPackageType: 'LEASING', page: 0, size: 1 })),
      BIDDING: this.countOf(this.investmentPackageService.filterPublishedInvestmentPackages({ investmentPackageType: 'BIDDING', page: 0, size: 1 })),
      CROWDFUNDING: this.countOf(this.investmentPackageService.filterPublishedInvestmentPackages({ investmentPackageType: 'CROWDFUNDING', page: 0, size: 1 })),
    });

    const userRoles$ = forkJoin({
      ADMIN: this.countOf(this.userService.filterUsers({ roles: ['ADMIN'], page: 0, size: 1 })),
      OPERATOR: this.countOf(this.userService.filterUsers({ roles: ['OPERATOR'], page: 0, size: 1 })),
      INVESTOR: this.countOf(this.userService.filterUsers({ roles: ['INVESTOR'], page: 0, size: 1 })),
      EXTENSION_WORKER: this.countOf(this.userService.filterUsers({ roles: ['EXTENSION_WORKER'], page: 0, size: 1 })),
    });

    const payments$ = forkJoin({
      PENDING: this.countOf(this.paymentService.getPayments(0, 1, 'PENDING')),
      PAID: this.countOf(this.paymentService.getPayments(0, 1, 'PAID')),
      EXPIRED: this.countOf(this.paymentService.getPayments(0, 1, 'EXPIRED')),
      CANCELLED: this.countOf(this.paymentService.getPayments(0, 1, 'CANCELLED')),
      DELIVERED: this.countOf(this.paymentService.getPayments(0, 1, 'DELIVERED')),
    });

    const followUps$ = this.farmFollowUpService.getAllForAdmin().pipe(
      catchError(() => of([] as FarmFollowUp[])),
    );

    const activeOptionsCounts$ = this.investmentPackageService.getStatusSummary().pipe(
      map((summary) => ({
        applied: summary.packageStatusCounts['APPLIED'] ?? 0,
        active: summary.packageStatusCounts['ACTIVE'] ?? 0,
      })),
      catchError(() => of({ applied: 0, active: 0 })),
    );

    // Needed to resolve which investment package (if any) each follow-up belongs to, so
    // follow-ups tied to a closed/inactive package can be excluded from the "Total Active" count.
    const allPackagesForFollowUps$ = this.investmentPackageService.filterInvestmentPackages({ page: 0, size: 500 }).pipe(
      map((r) => r?.content ?? []),
      catchError(() => of([] as InvestmentPackage[])),
    );

    const farmPlotInvestmentCounts$ = this.farmPlotService.filterFarmPlots({ page: 0, size: 200 }).pipe(
      map((r) => r?.content ?? []),
      switchMap((plots) => {
        if (plots.length === 0) return of([] as NamedCount[]);
        return forkJoin(
          plots.map((p) =>
            this.countOf(this.investmentPackageService.filterPublishedInvestmentPackages({ farmPlotId: p.id, page: 0, size: 1 })).pipe(
              map((value) => ({ label: p.title, value })),
            ),
          ),
        );
      }),
      catchError(() => of([] as NamedCount[])),
    );

    forkJoin({
      farmPlots: farmPlots$,
      investmentPackages: investmentPackages$,
      userRoles: userRoles$,
      payments: payments$,
      followUps: followUps$,
      farmPlotInvestmentCounts: farmPlotInvestmentCounts$,
      activeOptionsCounts: activeOptionsCounts$,
      allPackagesForFollowUps: allPackagesForFollowUps$,
    }).subscribe((result) => {
      this.computeDashboard(result);
      this.buildChartOptions();
      this.loading = false;
    });
  }

  private computeDashboard(result: {
    farmPlots: { operational: number; repair: number; archived: number };
    investmentPackages: { LEASING: number; BIDDING: number; CROWDFUNDING: number };
    userRoles: Record<string, number>;
    payments: Record<string, number>;
    followUps: FarmFollowUp[];
    farmPlotInvestmentCounts: NamedCount[];
    activeOptionsCounts: { applied: number; active: number };
    allPackagesForFollowUps: InvestmentPackage[];
  }): void {
    const { farmPlots, investmentPackages, userRoles, payments, followUps, farmPlotInvestmentCounts, activeOptionsCounts, allPackagesForFollowUps } = result;
    this.appliedInvestmentOptionsCount = activeOptionsCounts.applied;
    this.activeInvestmentOptionsCount = activeOptionsCounts.active;

    this.totalFarmPlots = farmPlots.operational + farmPlots.repair + farmPlots.archived;
    this.farmPlotActiveCount = farmPlots.operational;
    this.farmPlotArchivedCount = farmPlots.archived;
    this.farmPlotBreakdown = [
      { label: 'Operational', value: farmPlots.operational, color: '#22C55E' },
      { label: 'Repair / Damaged', value: farmPlots.repair, color: '#F59E0B' },
      { label: 'Archived', value: farmPlots.archived, color: '#94A3B8' },
    ];

    this.totalInvestmentPackages = investmentPackages.LEASING + investmentPackages.BIDDING + investmentPackages.CROWDFUNDING;
    this.investmentPackageBreakdown = [
      { label: 'Leasing', value: investmentPackages.LEASING, color: '#10B981' },
      { label: 'Bidding', value: investmentPackages.BIDDING, color: '#D97706' },
      { label: 'Crowdfunding', value: investmentPackages.CROWDFUNDING, color: '#4F46E5' },
    ];

    this.userRoleBreakdown = Object.entries(userRoles).map(([role, value]) => ({
      label: role,
      value,
      color: this.roleColor(role),
    }));
    this.totalUsers = this.userRoleBreakdown.reduce((sum, s) => sum + s.value, 0);

    this.totalPayments = Object.values(payments).reduce((sum, v) => sum + v, 0);

    this.totalFollowUps = followUps.length;
    this.followUpTrend = this.buildFollowUpTrend(followUps);
    this.computeFollowUpActiveCounts(followUps, allPackagesForFollowUps);

    this.farmPlotInvestmentBreakdown = [...farmPlotInvestmentCounts]
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);
  }

  private roleColor(role: string): string {
    switch (role) {
      case 'ADMIN':
        return '#4F46E5';
      case 'OPERATOR':
        return '#0EA5E9';
      case 'INVESTOR':
        return '#D97706';
      case 'EXTENSION_WORKER':
        return '#22C55E';
      default:
        return '#CBD5E1';
    }
  }

  /**
   * Buckets follow-ups by the month they were created (last 6 months), then splits each
   * month's cohort by current state. EXCLUDED follow-ups are intentionally left out of all
   * three buckets — they're neither completed, pending, nor overdue.
   */
  private buildFollowUpTrend(followUps: FarmFollowUp[]): MonthlyFollowUpPattern[] {
    const now = new Date();
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString(undefined, { month: 'short', year: '2-digit' }),
      });
    }

    const completed: Record<string, number> = {};
    const pending: Record<string, number> = {};
    const overdue: Record<string, number> = {};
    for (const m of months) {
      completed[m.key] = 0;
      pending[m.key] = 0;
      overdue[m.key] = 0;
    }

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const f of followUps) {
      if (f.taskStatus === 'EXCLUDED') continue;
      if (!f.createdAt) continue;
      const created = new Date(f.createdAt);
      if (!Number.isFinite(created.getTime())) continue;
      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
      if (completed[key] === undefined) continue;

      if (f.taskStatus === 'DONE') {
        completed[key]++;
      } else {
        const end = f.endDate ? new Date(f.endDate) : null;
        if (end && Number.isFinite(end.getTime()) && end < today) {
          overdue[key]++;
        } else {
          pending[key]++;
        }
      }
    }

    return months.map((m) => ({
      label: m.label,
      completed: completed[m.key],
      pending: pending[m.key],
      overdue: overdue[m.key],
    }));
  }

  /**
   * A follow-up's `externalId` is polymorphic — it's either the investment package's own id, or
   * the id of the agreement it was raised against (whose `agreementId` then points back to the
   * package). Either way, resolving it tells us which package (if any) the follow-up belongs to.
   * "Total Active" only counts ACTIVE follow-ups whose package is still ACTIVE/APPLIED/IN_USE —
   * a follow-up left over from a package that's since gone INACTIVE/COMPLITED isn't counted.
   */
  private computeFollowUpActiveCounts(followUps: FarmFollowUp[], allPackages: InvestmentPackage[]): void {
    const statusById = new Map(allPackages.map((p) => [p.id, p.packageStatus]));
    const statusByAgreementId = new Map(
      allPackages.filter((p) => p.agreementId).map((p) => [p.agreementId as string, p.packageStatus]),
    );
    const isLinkedToActivePackage = (externalId: string): boolean => {
      const status = statusById.get(externalId) ?? statusByAgreementId.get(externalId);
      return !!status && status !== 'INACTIVE' && status !== 'COMPLITED';
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueSoonCutoff = new Date(today);
    dueSoonCutoff.setDate(dueSoonCutoff.getDate() + 7);

    let active = 0;
    let dueSoon = 0;
    let totalActive = 0;

    for (const f of followUps) {
      if (f.taskStatus !== 'ACTIVE') continue;
      active++;

      if (f.endDate) {
        const end = new Date(f.endDate);
        if (Number.isFinite(end.getTime()) && end >= today && end <= dueSoonCutoff) {
          dueSoon++;
        }
      }

      if (isLinkedToActivePackage(f.externalId)) {
        totalActive++;
      }
    }

    this.followUpActiveCount = active;
    this.followUpDueSoonCount = dueSoon;
    this.followUpTotalActiveCount = totalActive;
  }

  private buildChartOptions(): void {
    this.farmPlotChartOption = this.donutOption(this.farmPlotBreakdown);
    this.investmentPackageChartOption = this.donutOption(this.investmentPackageBreakdown);

    this.userRoleChartOption = {
      tooltip: { trigger: 'axis' },
      grid: { left: 100, right: 20, top: 20, bottom: 20, containLabel: true },
      xAxis: { type: 'value', minInterval: 1 },
      yAxis: { type: 'category', data: this.userRoleBreakdown.map((s) => s.label) },
      series: [
        {
          type: 'bar',
          data: this.userRoleBreakdown.map((s) => ({ value: s.value, itemStyle: { color: s.color } })),
        },
      ],
    };

    this.farmPlotInvestmentChartOption = {
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 20, bottom: 10, containLabel: true },
      xAxis: {
        type: 'category',
        data: this.farmPlotInvestmentBreakdown.map((s) => s.label),
        axisLabel: { show: false },
        axisTick: { show: false },
      },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          type: 'bar',
          itemStyle: { color: '#4F46E5' },
          data: this.farmPlotInvestmentBreakdown.map((s) => s.value),
        },
      ],
    };

    this.followUpTrendChartOption = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['Completed', 'Pending', 'Overdue'], bottom: 0 },
      grid: { left: 36, right: 20, top: 30, bottom: 40, containLabel: true },
      xAxis: { type: 'category', data: this.followUpTrend.map((t) => t.label) },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          name: 'Completed',
          type: 'line',
          smooth: true,
          itemStyle: { color: '#22C55E' },
          data: this.followUpTrend.map((t) => t.completed),
        },
        {
          name: 'Pending',
          type: 'line',
          smooth: true,
          itemStyle: { color: '#F59E0B' },
          data: this.followUpTrend.map((t) => t.pending),
        },
        {
          name: 'Overdue',
          type: 'line',
          smooth: true,
          itemStyle: { color: '#EF4444' },
          data: this.followUpTrend.map((t) => t.overdue),
        },
      ],
    };
  }

  private donutOption(slices: CountSlice[]): EChartsOption {
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'horizontal', bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '45%'],
          label: { show: false },
          emphasis: { label: { show: true, fontWeight: 'bold' } },
          data: slices.map((s) => ({ name: s.label, value: s.value, itemStyle: { color: s.color } })),
        },
      ],
    };
  }
}
