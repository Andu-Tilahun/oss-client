import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  InvestmentPackageTypeAgreement,
  InvestmentPackageTypeFilterRequest,
} from '../../../investment-package-types/models/investment-package-type.model';
import { InvestmentPackageTypeService } from '../../../investment-package-types/services/investment-package-type.service';
import { FarmPlotViewComponent } from '../../components/farm-plot-view/farm-plot-view.component';
import { InvestmentPackageTypeViewComponent } from '../../../investment-package-types/components/investment-package-type-view/investment-package-type-view.component';
import { TabsComponent } from '../../../../shared/tabs/app-tabs/app-tabs.component';
import { TabItem } from '../../../../shared/tabs/models/tab-item.model';
import { FarmFollowupsModule } from '../../../farm-followups/farm-followups.module';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-farm-plots-extension-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FarmPlotViewComponent,
    InvestmentPackageTypeViewComponent,
    TabsComponent,
    FarmFollowupsModule,
  ],
  templateUrl: './farm-plots-extension-detail-page.component.html',
})
export class FarmPlotsExtensionDetailPageComponent implements OnInit {
  agreement: InvestmentPackageTypeAgreement | null = null;
  activeTab = 'farm-plot';
  readonly tabs: TabItem[] = [
    { key: 'farm-plot', label: 'Farm Plot Detail' },
    { key: 'lease', label: 'Lease Agreement' },
    { key: 'follow-up', label: 'Follow-ups' },
  ];

  constructor(
    private route: ActivatedRoute,
    private investmentPackageTypeService: InvestmentPackageTypeService,
    private authService: AuthService,
  ) {}

  get isFollowUpReadOnly(): boolean {
    return this.authService.isExtensionWorker() &&
      (this.agreement?.packageStatus === 'INACTIVE' || this.agreement?.packageStatus === 'COMPLITED');
  }

  ngOnInit(): void {
    const fromNavState = history.state?.agreement as InvestmentPackageTypeAgreement | undefined;
    if (fromNavState?.id) {
      this.agreement = fromNavState;
      return;
    }

    const packageTypeId = this.route.snapshot.paramMap.get('leaseId') ?? '';
    if (!packageTypeId) return;

    const request: InvestmentPackageTypeFilterRequest = {
      sortBy: 'startDate',
      sortDirection: 'DESC',
      page: 0,
      size: 1000,
    };

    this.investmentPackageTypeService.filter(request).subscribe({
      next: (response) => {
        const agreements = response.content ?? [];
        this.agreement = agreements.find((a) => a.id === packageTypeId) ?? null;
      },
      error: () => {
        this.agreement = null;
      },
    });
  }
}
