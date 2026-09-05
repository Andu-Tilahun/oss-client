import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { AuthService } from '../auth/services/auth.service';
import { User } from '../users/models/user.model';
import { InvestmentPackageTypeService } from '../investment-package-types/services/investment-package-type.service';
import {
  InvestmentPackageTypeAgreement,
  InvestmentPackageTypeFilterRequest,
} from '../investment-package-types/models/investment-package-type.model';
import { FarmFollowUp } from '../farm-followups/models/farm-followup.model';
import { PageResponse } from '../../shared/models/api-response.model';

interface CountSlice {
  label: string;
  value: number;
  color: string;
}

interface FollowUpItem extends FarmFollowUp {
  agreementId: string;
  plotTitle: string;
}

interface AssignmentProgressItem {
  agreementId: string;
  agreement: InvestmentPackageTypeAgreement;
  plotTitle: string;
  pct: number;
  daysRemaining: number | null;
}

interface MonthlyCompletion {
  label: string;
  completed: number;
  open: number;
}

@Component({
  selector: 'app-extension-home',
  standalone: true,
  imports: [CommonModule, RouterModule, NgxEchartsDirective],
  templateUrl: './extension-home.component.html',
})
export class ExtensionHomeComponent implements OnInit {
  currentUser?: User;
  greeting = '';
  loading = true;

  private allFollowUps: FollowUpItem[] = [];

  totalPlots = 0;
  activeAssignments = 0;
  totalFollowUps = 0;
  completedFollowUps = 0;
  openFollowUpsCount = 0;
  completionRatePct: number | null = null;

  statusBreakdown: CountSlice[] = [];
  typeBreakdown: CountSlice[] = [];
  followUpCompletionTrend: MonthlyCompletion[] = [];
  assignmentProgress: AssignmentProgressItem[] = [];
  upcomingFollowUps: FollowUpItem[] = [];

  completionGaugeOption: EChartsOption = {};
  statusChartOption: EChartsOption = {};
  typeChartOption: EChartsOption = {};
  followUpTrendChartOption: EChartsOption = {};

  constructor(
    private authService: AuthService,
    private investmentPackageTypeService: InvestmentPackageTypeService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user || undefined;
    });
    this.setGreeting();
    this.loadDashboard();
  }

  goToAgreement(agreementId: string, agreement?: InvestmentPackageTypeAgreement): void {
    this.router.navigate(['/farm-plots-extension/detail', agreementId], { state: { agreement } });
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

  private loadDashboard(): void {
    this.loading = true;
    const request: InvestmentPackageTypeFilterRequest = {
      sortBy: 'startDate',
      sortDirection: 'DESC',
      page: 0,
      size: 1000,
    };

    this.investmentPackageTypeService
      .filter(request)
      .pipe(catchError(() => of(this.emptyPage<InvestmentPackageTypeAgreement>())))
      .subscribe((response) => {
        const agreements = (response.content ?? []).filter((a) => !!a?.farmPlot);
        this.computeDashboard(agreements);
        this.buildChartOptions();
        this.loading = false;
      });
  }

  private isActiveAssignment(agreement: InvestmentPackageTypeAgreement): boolean {
    const active = new Set(['ACTIVE', 'ACCEPTED', 'SENT', 'OPEN', 'FUNDED']);
    const status = agreement.status ?? agreement.fundingStatus ?? '';
    const packageActive = agreement.packageStatus !== 'INACTIVE' && agreement.packageStatus !== 'COMPLITED';
    return active.has(status) && packageActive;
  }

  private isCompletedFollowUp(followUp: FarmFollowUp): boolean {
    if (!followUp.endDate) return false;
    const end = new Date(followUp.endDate).getTime();
    return Number.isFinite(end) && end < Date.now();
  }

  private computeDashboard(agreements: InvestmentPackageTypeAgreement[]): void {
    const plotIds = new Set(
      agreements.map((a) => a.farmPlot?.id).filter((id): id is string => !!id),
    );
    this.totalPlots = plotIds.size;

    const activeAgreements = agreements.filter((a) => this.isActiveAssignment(a));
    this.activeAssignments = activeAgreements.length;

    this.allFollowUps = agreements.flatMap((a) =>
      (a.followUpDtoList ?? []).map((f) => ({
        ...f,
        agreementId: a.id,
        plotTitle: a.farmPlot?.title || 'Farm plot',
      })),
    );

    this.totalFollowUps = this.allFollowUps.length;
    this.completedFollowUps = this.allFollowUps.filter((f) => this.isCompletedFollowUp(f)).length;
    this.openFollowUpsCount = this.totalFollowUps - this.completedFollowUps;
    this.completionRatePct =
      this.totalFollowUps > 0 ? Math.round((this.completedFollowUps / this.totalFollowUps) * 100) : null;

    this.statusBreakdown = this.groupCount(agreements, (a) => a.packageStatus ?? a.status ?? 'UNKNOWN').map((s) => ({
      ...s,
      color: this.statusColor(s.label),
    }));
    this.typeBreakdown = this.groupCount(agreements, (a) => a.investmentPackageType ?? 'UNKNOWN').map((s) => ({
      ...s,
      color: this.typeColor(s.label),
    }));

    this.followUpCompletionTrend = this.buildFollowUpTrend();

    this.assignmentProgress = activeAgreements
      .map((a) => ({
        agreementId: a.id,
        agreement: a,
        plotTitle: a.farmPlot?.title || 'Farm plot',
        pct: this.assignmentProgressPct(a),
        daysRemaining: this.assignmentDaysRemaining(a),
      }))
      .sort((a, b) => (a.daysRemaining ?? Infinity) - (b.daysRemaining ?? Infinity))
      .slice(0, 6);

    this.upcomingFollowUps = this.allFollowUps
      .filter((f) => !this.isCompletedFollowUp(f))
      .sort((a, b) => this.followUpDueTime(a) - this.followUpDueTime(b))
      .slice(0, 5);
  }

  private followUpDueTime(followUp: FollowUpItem): number {
    const dateStr = followUp.endDate || followUp.startDate;
    if (!dateStr) return Infinity;
    const time = new Date(dateStr).getTime();
    return Number.isFinite(time) ? time : Infinity;
  }

  private buildFollowUpTrend(): MonthlyCompletion[] {
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
    const open: Record<string, number> = {};
    for (const m of months) {
      completed[m.key] = 0;
      open[m.key] = 0;
    }

    for (const f of this.allFollowUps) {
      const isDone = this.isCompletedFollowUp(f);
      const dateStr = isDone ? f.endDate : f.createdAt ?? f.startDate;
      if (!dateStr) continue;
      const d = new Date(dateStr);
      if (!Number.isFinite(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (isDone) {
        if (completed[key] !== undefined) completed[key]++;
      } else if (open[key] !== undefined) {
        open[key]++;
      }
    }

    return months.map((m) => ({ label: m.label, completed: completed[m.key], open: open[m.key] }));
  }

  private assignmentProgressPct(agreement: InvestmentPackageTypeAgreement): number {
    if (!agreement.startDate || !agreement.endDate) return 0;
    const start = new Date(agreement.startDate).getTime();
    const end = new Date(agreement.endDate).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
    const pct = ((Date.now() - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, Math.round(pct)));
  }

  private assignmentDaysRemaining(agreement: InvestmentPackageTypeAgreement): number | null {
    if (!agreement.endDate) return null;
    const end = new Date(agreement.endDate).getTime();
    if (!Number.isFinite(end)) return null;
    return Math.max(0, Math.round((end - Date.now()) / 86400000));
  }

  private groupCount<T>(items: T[], keyFn: (item: T) => string): { label: string; value: number }[] {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const key = keyFn(item) || 'UNKNOWN';
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }

  private statusColor(label: string): string {
    switch (label) {
      case 'ACTIVE':
        return '#22C55E';
      case 'APPLIED':
        return '#F59E0B';
      case 'IN_USE':
        return '#3B82F6';
      case 'INACTIVE':
        return '#94A3B8';
      case 'COMPLITED':
        return '#A855F7';
      default:
        return '#CBD5E1';
    }
  }

  private typeColor(label: string): string {
    switch (label) {
      case 'LEASING':
        return '#10B981';
      case 'BIDDING':
        return '#D97706';
      case 'CROWDFUNDING':
        return '#4F46E5';
      default:
        return '#CBD5E1';
    }
  }

  private buildChartOptions(): void {
    this.completionGaugeOption = {
      series: [
        {
          type: 'gauge',
          startAngle: 200,
          endAngle: -20,
          min: 0,
          max: 100,
          progress: { show: true, width: 14, itemStyle: { color: '#10B981' } },
          axisLine: { lineStyle: { width: 14, color: [[1, '#E2E8F0']] } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          pointer: { show: false },
          detail: {
            valueAnimation: true,
            formatter: '{value}%',
            color: '#065F46',
            fontSize: 26,
            fontWeight: 'bold',
            offsetCenter: [0, '10%'],
          },
          data: [{ value: this.completionRatePct ?? 0 }],
        },
      ],
    } as EChartsOption;

    this.statusChartOption = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'horizontal', bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '45%'],
          label: { show: false },
          emphasis: { label: { show: true, fontWeight: 'bold' } },
          data: this.statusBreakdown.map((s) => ({ name: s.label, value: s.value, itemStyle: { color: s.color } })),
        },
      ],
    };

    this.typeChartOption = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'horizontal', bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '45%'],
          label: { show: false },
          emphasis: { label: { show: true, fontWeight: 'bold' } },
          data: this.typeBreakdown.map((s) => ({ name: s.label, value: s.value, itemStyle: { color: s.color } })),
        },
      ],
    };

    this.followUpTrendChartOption = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['Completed', 'Open'], bottom: 0 },
      grid: { left: 36, right: 10, top: 20, bottom: 40, containLabel: true },
      xAxis: { type: 'category', data: this.followUpCompletionTrend.map((t) => t.label) },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          name: 'Completed',
          type: 'bar',
          stack: 'total',
          itemStyle: { color: '#10B981' },
          data: this.followUpCompletionTrend.map((t) => t.completed),
        },
        {
          name: 'Open',
          type: 'bar',
          stack: 'total',
          itemStyle: { color: '#F59E0B' },
          data: this.followUpCompletionTrend.map((t) => t.open),
        },
      ],
    };
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
