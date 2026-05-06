import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LeaseAgreement, LeaseFilterRequest } from '../../../farm-leases/models/farm-lease.model';
import { FarmLeaseService } from '../../../farm-leases/services/farm-lease.service';
import { FarmPlotViewComponent } from '../../components/farm-plot-view/farm-plot-view.component';
import { FarmLeaseViewComponent } from '../../../farm-leases/components/farm-lease-view/farm-lease-view.component';
import { TabsComponent } from '../../../../shared/tabs/app-tabs/app-tabs.component';
import { TabItem } from '../../../../shared/tabs/models/tab-item.model';
import { FarmFollowupsModule } from '../../../farm-followups/farm-followups.module';

@Component({
  selector: 'app-farm-plots-extension-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FarmPlotViewComponent,
    FarmLeaseViewComponent,
    TabsComponent,
    FarmFollowupsModule,
  ],
  templateUrl: './farm-plots-extension-detail-page.component.html',
})
export class FarmPlotsExtensionDetailPageComponent implements OnInit {
  lease: LeaseAgreement | null = null;
  activeTab = 'farm-plot';
  readonly tabs: TabItem[] = [
    { key: 'farm-plot', label: 'Farm Plot Detail' },
    { key: 'lease', label: 'Lease Agreement' },
    { key: 'follow-up', label: 'Follow-ups' },
  ];

  constructor(
    private route: ActivatedRoute,
    private farmLeaseService: FarmLeaseService
  ) {}

  ngOnInit(): void {
    const fromNavState = history.state?.lease as LeaseAgreement | undefined;
    if (fromNavState?.id) {
      this.lease = fromNavState;
      return;
    }

    const leaseId = this.route.snapshot.paramMap.get('leaseId') ?? '';
    if (!leaseId) return;

    const request: LeaseFilterRequest = {
      sortBy: 'startDate',
      sortDirection: 'DESC',
      page: 0,
      size: 1000,
    };

    this.farmLeaseService.filterLeases(request).subscribe({
      next: (response) => {
        const leases = response.content ?? [];
        this.lease = leases.find((l) => l.id === leaseId) ?? null;
      },
      error: () => {
        this.lease = null;
      },
    });
  }
}
