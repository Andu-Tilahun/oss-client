import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {InvestmentPackageTypeAgreement} from '../../models/investment-package-type.model';
import {InvestmentPackageTypeService} from '../../services/investment-package-type.service';
import {
  InvestmentPackage,
  InvestmentPackageType,
  InvestmentRecord,
} from '../../../investment-package/models/investment-package.model';
import {InvestmentPackageService} from '../../../investment-package/services/investment-package.service';
import {TabItem} from '../../../../shared/tabs/models/tab-item.model';
import {ToastService} from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-investment-package-type-mobile-detail',
  standalone: false,
  templateUrl: './investment-package-type-mobile-detail.component.html',
})
export class InvestmentPackageTypeMobileDetailComponent implements OnInit {
  agreement: InvestmentPackageTypeAgreement | null = null;
  loading = false;
  error = '';

  investmentPackageType: InvestmentPackageType = 'LEASING';
  pageTitle = 'Leasing Investment Packages';
  detailRefreshKey = 0;

  tabs: TabItem[] = [
    {key: 'detail', label: 'Detail'},
    {key: 'farm-plot', label: 'FarmPlot'},
    {key: 'investor', label: 'Investor'},
    {key: 'extension-worker', label: 'Extension Worker'},
    {key: 'follow-up', label: 'FollowUp'},
  ];

  packageInvestments: InvestmentRecord[] = [];
  packageInvestmentsLoading = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly investmentPackageTypeService: InvestmentPackageTypeService,
    private readonly investmentPackageService: InvestmentPackageService,
    private readonly toastService: ToastService,
  ) {
    const data = this.route.snapshot.data;
    this.investmentPackageType = data['investmentPackageType'] ?? 'LEASING';
    this.pageTitle = data['pageTitle'] ?? 'Leasing Investment Packages';
  }

  get routeSegment(): string {
    return this.investmentPackageType.toLowerCase();
  }

  get listRoute(): string {
    return `/investment-package-types/${this.routeSegment}`;
  }

  ngOnInit(): void {
    const packageTypeId = this.route.snapshot.paramMap.get('id');
    if (!packageTypeId) {
      this.error = 'Package type not found.';
      return;
    }

    this.loading = true;
    this.investmentPackageTypeService.getById(packageTypeId).subscribe({
      next: (res) => {
        this.agreement = (res as unknown as InvestmentPackageTypeAgreement) ?? null;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load package type detail.';
        this.loading = false;
      },
    });
  }

  asInvestmentPackage(lease: InvestmentPackageTypeAgreement | null): InvestmentPackage | null {
    if (!lease) {
      return null;
    }
    return {
      ...lease,
      farmPlotId: lease.farmPlotId ?? lease.farmPlot?.id ?? '',
      followUpDtoList: lease.followUpDtoList ?? [],
    } as InvestmentPackage;
  }

  onTabChange(tab: string): void {
    if (tab === 'investor' && this.agreement?.id) {
      this.loadPackageInvestments(this.agreement.id);
    }
  }

  onExtensionWorkerAssigned(pkg: InvestmentPackage): void {
    this.agreement = pkg as InvestmentPackageTypeAgreement;
    this.detailRefreshKey++;
  }

  private loadPackageInvestments(packageId: string): void {
    this.packageInvestmentsLoading = true;
    this.investmentPackageService.filterInvestments({
      crowdFundingIds: [packageId],
      sortBy: 'createdDate',
      sortDirection: 'DESC',
      page: 0,
      size: 100,
    }).subscribe({
      next: (response) => {
        this.packageInvestments = (response.content ?? []).filter(
          (investment) => investment.crowdFundingId === packageId,
        );
        this.packageInvestmentsLoading = false;
      },
      error: (error) => {
        this.packageInvestments = [];
        this.packageInvestmentsLoading = false;
        this.toastService.error(
          error.message || 'Failed to load package investors',
          'Load Investors',
        );
      },
    });
  }
}
