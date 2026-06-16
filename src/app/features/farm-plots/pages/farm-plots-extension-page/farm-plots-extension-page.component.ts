import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FarmPlot } from '../../models/farm-plot.model';
import { InvestmentPackageTypeAgreement, InvestmentPackageTypeFilterRequest } from '../../../investment-package-types/models/investment-package-type.model';
import { TabItem } from '../../../../shared/tabs/models/tab-item.model';
import { PageSplitLayoutComponent } from '../../../../shared/components/page-split-layout/page-split-layout/page-split-layout.component';
import { FarmPlotViewComponent } from '../../components/farm-plot-view/farm-plot-view.component';
import { InvestmentPackageTypeViewComponent } from '../../../investment-package-types/components/investment-package-type-view/investment-package-type-view.component';
import { TabsComponent } from '../../../../shared/tabs/app-tabs/app-tabs.component';
import { FarmFollowupsModule } from '../../../farm-followups/farm-followups.module';
import { InvestmentPackageTypeService } from '../../../investment-package-types/services/investment-package-type.service';
import { FundingStatus } from '../../../../shared/models/funding-status.model';
import { SharedModule } from '../../../../shared/shared.module';
import { environment } from '../../../../../environments/environment';
import { Router } from '@angular/router';

interface AssignedFarmPlot extends FarmPlot {
  agreement: InvestmentPackageTypeAgreement;
}

@Component({
  selector: 'app-farm-plots-extension-page',
  standalone: true,
  imports: [
    CommonModule,
    PageSplitLayoutComponent,
    FarmPlotViewComponent,
    InvestmentPackageTypeViewComponent,
    TabsComponent,
    FarmFollowupsModule,
    SharedModule,
  ],
  templateUrl: './farm-plots-extension-page.component.html',
})
export class FarmPlotsExtensionPageComponent implements OnInit {
  private readonly storageApiUrl = `${environment.apiUrl}/files`;
  activeAssignedPlots: AssignedFarmPlot[] = [];
  previousAssignedAgreements: InvestmentPackageTypeAgreement[] = [];
  selectedPlot: AssignedFarmPlot | null = null;
  selectedAgreement: InvestmentPackageTypeAgreement | null = null;
  activeTab = 'farm-plot';
  readonly tabs: TabItem[] = [
    { key: 'farm-plot', label: 'Farm Plot Detail' },
    { key: 'lease', label: 'Lease Agreement' },
    { key: 'follow-up', label: 'Follow-ups' },
  ];
  readonly getCurrentPlotCardTitle = (plot: AssignedFarmPlot): string =>
    plot.title.length > 30 ? `${plot.title.slice(0, 28)}..` : plot.title;
  readonly getCurrentPlotThumbnailAlt = (plot: AssignedFarmPlot): string => `${plot.title} thumbnail`;
  readonly getCurrentPlotThumbnailUrl = (plot: AssignedFarmPlot): string | null =>
    plot.imageUuid ? `${this.storageApiUrl}/${plot.imageUuid}` : null;

  constructor(
    private investmentPackageTypeService: InvestmentPackageTypeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.previousAssignedAgreements = this.buildMockPreviousAssignedAgreements();
    this.loadAssignedPlots();
  }

  selectPlot(plot: AssignedFarmPlot | null): void {
    if (plot && this.isMobileViewport()) {
      void this.router.navigate(['/farm-plots-extension/detail', plot.agreement.id], {
        state: { agreement: plot.agreement },
      });
      return;
    }
    this.selectedPlot = plot;
    this.selectedAgreement = plot?.agreement ?? null;
    this.activeTab = 'farm-plot';
  }

  selectPreviousAgreement(agreement: InvestmentPackageTypeAgreement): void {
    if (!agreement?.farmPlot) return;
    if (this.isMobileViewport()) {
      void this.router.navigate(['/farm-plots-extension/detail', agreement.id], {
        state: { agreement },
      });
      return;
    }
    this.selectedAgreement = agreement;
    this.selectedPlot = {
      ...agreement.farmPlot,
      agreement,
    };
    this.activeTab = 'farm-plot';
  }

  get currentActivePlot(): AssignedFarmPlot | null {
    if (this.selectedPlot && this.activeAssignedPlots.some((plot) => plot.id === this.selectedPlot?.id)) {
      return this.selectedPlot;
    }
    return this.activeAssignedPlots[0] ?? null;
  }

  get currentActivePlotList(): AssignedFarmPlot[] {
    return this.currentActivePlot ? [this.currentActivePlot] : [];
  }

  private isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 1020;
  }

  private loadAssignedPlots(): void {
    const request: InvestmentPackageTypeFilterRequest = {
      sortBy: 'startDate',
      sortDirection: 'DESC',
      page: 0,
      size: 1000,
    };

    this.investmentPackageTypeService.filter(request).subscribe({
      next: (response) => {
        const agreements = response.content ?? [];
        const assigned = agreements
          .filter((agreement) => !!agreement?.farmPlot)
          .map((agreement) => ({
            ...agreement.farmPlot,
            agreement,
          }));

        const currentlyAssignedStatuses = new Set(['ACTIVE', 'ACCEPTED', 'SENT', 'OPEN', 'FUNDED']);
        this.activeAssignedPlots = assigned.filter((item) => {
          const status = item.agreement.status ?? item.agreement.fundingStatus ?? '';
          return currentlyAssignedStatuses.has(status);
        });

        this.selectPlot(this.activeAssignedPlots[0] ?? assigned[0] ?? null);
      },
      error: () => {
        this.activeAssignedPlots = [];
        this.selectPlot(null);
      },
    });
  }

  private buildMockPreviousAssignedAgreements(): InvestmentPackageTypeAgreement[] {
    const investorUser = {
      id: 'mock-investor-1',
      username: 'investor.user',
      email: 'investor.user@example.com',
      firstName: 'Investor',
      lastName: 'User',
      gender: 'M',
      role: 'INVESTOR',
      enabled: true,
      accountNonLocked: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const extensionWorker = {
      id: 'mock-extension-1',
      username: 'extension.worker',
      email: 'extension.worker@example.com',
      firstName: 'Extension',
      lastName: 'Worker',
      gender: 'M',
      role: 'EXTENSION_WORKER',
      enabled: true,
      accountNonLocked: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return [
      {
        id: 'mock-lease-1',
        farmPlotId: 'mock-plot-1',
        investorId: investorUser.id,
        startDate: '2025-10-01',
        endDate: '2026-02-01',
        farmActivity: 'CROPS',
        waterSource: 'RAIN_FED',
        title: 'Bole West Leasing Package',
        targetAmount: 120000,
        minimumContribution: 120000,
        fundingStatus: FundingStatus.CLOSED,
        totalDurationMonths: 4,
        status: 'TERMINATED',
        totalAmount: 120000,
        investorUser,
        extensionWorker,
        followUpDtoList: [],
        terms: [],
        farmPlot: {
          id: 'mock-plot-1',
          title: 'Bole West Plot',
          description: 'Historical assignment completed in prior season.',
          size: 10,
          sizeType: 'HECTARES',
          latitude: 8.995,
          longitude: 38.79,
          soilType: 'LOAMY',
          status: 'ASSIGNED_TO_LEASE',
        },
      },
      {
        id: 'mock-lease-2',
        farmPlotId: 'mock-plot-2',
        investorId: investorUser.id,
        startDate: '2025-06-15',
        endDate: '2025-12-15',
        farmActivity: 'CROPS',
        waterSource: 'IRRIGATION',
        title: 'Akaki Riverside Leasing Package',
        targetAmount: 98000,
        minimumContribution: 98000,
        fundingStatus: FundingStatus.FUNDED,
        totalDurationMonths: 6,
        status: 'ACCEPTED',
        totalAmount: 98000,
        investorUser,
        extensionWorker,
        followUpDtoList: [],
        terms: [],
        farmPlot: {
          id: 'mock-plot-2',
          title: 'Akaki Riverside Plot',
          description: 'Previous assignment retained for reference.',
          size: 16,
          sizeType: 'ACRES',
          latitude: 8.91,
          longitude: 38.81,
          soilType: 'CLAY',
          status: 'ASSIGNED_TO_LEASE',
        },
      },
    ];
  }
}
