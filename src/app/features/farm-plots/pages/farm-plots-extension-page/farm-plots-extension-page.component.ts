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

  allAgreements: InvestmentPackageTypeAgreement[] = [];
  loading = false;

  selectedPlot: AssignedFarmPlot | null = null;
  selectedAgreement: InvestmentPackageTypeAgreement | null = null;
  activeTab = 'farm-plot';

  readonly tabs: TabItem[] = [
    { key: 'farm-plot', label: 'Farm Plot Detail' },
    { key: 'lease', label: 'Lease Agreement' },
    { key: 'follow-up', label: 'Follow-ups' },
  ];

  constructor(
    private investmentPackageTypeService: InvestmentPackageTypeService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadAssignedPlots();
  }

  get leasingAgreements(): InvestmentPackageTypeAgreement[] {
    return this.allAgreements.filter((a) => a.investmentPackageType === 'LEASING');
  }

  get biddingAgreements(): InvestmentPackageTypeAgreement[] {
    return this.allAgreements.filter((a) => a.investmentPackageType === 'BIDDING');
  }

  get crowdfundingAgreements(): InvestmentPackageTypeAgreement[] {
    return this.allAgreements.filter((a) => a.investmentPackageType === 'CROWDFUNDING');
  }

  isActiveStatus(agreement: InvestmentPackageTypeAgreement): boolean {
    const active = new Set(['ACTIVE', 'ACCEPTED', 'SENT', 'OPEN', 'FUNDED']);
    const status = agreement.status ?? agreement.fundingStatus ?? '';
    return active.has(status);
  }

  selectAgreement(agreement: InvestmentPackageTypeAgreement | null): void {
    if (!agreement?.farmPlot) return;
    if (this.isMobileViewport()) {
      void this.router.navigate(['/farm-plots-extension/detail', agreement.id], {
        state: { agreement },
      });
      return;
    }
    this.selectedAgreement = agreement;
    this.selectedPlot = { ...agreement.farmPlot, agreement };
    this.activeTab = 'farm-plot';
  }

  private isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 1020;
  }

  private loadAssignedPlots(): void {
    this.loading = true;
    const request: InvestmentPackageTypeFilterRequest = {
      sortBy: 'startDate',
      sortDirection: 'DESC',
      page: 0,
      size: 1000,
    };

    this.investmentPackageTypeService.filter(request).subscribe({
      next: (response) => {
        this.allAgreements = (response.content ?? []).filter((a) => !!a?.farmPlot);
        this.loading = false;
        const first =
          this.allAgreements.find((a) => this.isActiveStatus(a)) ?? this.allAgreements[0] ?? null;
        this.selectAgreement(first);
      },
      error: () => {
        this.allAgreements = [];
        this.loading = false;
      },
    });
  }
}
