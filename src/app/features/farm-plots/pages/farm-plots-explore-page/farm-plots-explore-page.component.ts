import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import {TableQueryParams} from '../../../../shared/data-table/models/table-query-params.model';
import {PageResponse} from '../../../../shared/models/api-response.model';
import {environment} from '../../../../../environments/environment';
import {ImageGalleryModalComponent} from '../../../../shared/modals/image-gallery-modal/image-gallery-modal.component';
import {PublicDrawerComponent} from '../../../../public/public-drawer/public-drawer.component';
import {PublicPlotsComponent} from '../../../../public/public-plots/public-plots.component';
import {InvestmentPackage} from '../../../investment-package/models/investment-package.model';
import {InvestmentPackageService} from '../../../investment-package/services/investment-package.service';
import {FarmPlotService} from '../../services/farm-plot.service';

@Component({
  selector: 'app-farm-plots-explore-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ImageGalleryModalComponent, PublicDrawerComponent, PublicPlotsComponent],
  templateUrl: './farm-plots-explore-page.component.html',
})
export class FarmPlotsExplorePageComponent implements OnInit {
  private readonly storageApiUrl = `${environment.apiUrl}/files`;
  private readonly initialLoadSize = 500;

  packages: InvestmentPackage[] = [];
  filteredPackages: InvestmentPackage[] = [];
  pagedPackages: InvestmentPackage[] = [];
  selectedPackage: InvestmentPackage | null = null;

  loadingPackages = false;
  galleryLoading = false;
  showGalleryModal = false;
  galleryImageUrls: string[] = [];
  galleryTitle = 'Farm Plot Gallery';

  total = 0;
  pageIndex = 1;
  pageSize = 10;

  searchText = '';

  readonly getPackageCardTitle = (pkg: InvestmentPackage): string => pkg.title;
  readonly getPackageThumbnailAlt = (pkg: InvestmentPackage): string => `${pkg.title} thumbnail`;
  readonly getPackageThumbnailUrl = (pkg: InvestmentPackage): string | null =>
    pkg.farmPlot?.imageUuid ? `${this.storageApiUrl}/${pkg.farmPlot.imageUuid}` : null;
  readonly getPublicCardSubtitle = (pkg: InvestmentPackage): string =>
    `${pkg.investmentPackageType ?? '-'} • ${pkg.farmActivity} • Target ${this.formatAmount(pkg.targetAmount)}`;
  readonly getPublicCardDescription = (pkg: InvestmentPackage): string =>
    pkg.farmPlot?.description || pkg.remark || 'Explore this open investment opportunity.';
  readonly getPublicCardBadges = (pkg: InvestmentPackage): string[] => [
    pkg.investmentPackageType ?? '-',
    pkg.fundingStatus,
  ];

  constructor(
    private investmentPackageService: InvestmentPackageService,
    private farmPlotService: FarmPlotService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.loadPackages();
  }

  loadPackages(): void {
    this.loadingPackages = true;
    this.investmentPackageService.getPublicInvestmentPackages(0, this.initialLoadSize).subscribe({
      next: (response: PageResponse<InvestmentPackage>) => {
        this.packages = (response.content ?? []).filter(
          (pkg) => pkg.fundingStatus === 'OPEN' && pkg.packageStatus !== 'INACTIVE' && pkg.packageStatus !== 'COMPLITED',
        );
        this.applyClientFilters();
        this.loadingPackages = false;
      },
      error: () => {
        this.packages = [];
        this.filteredPackages = [];
        this.pagedPackages = [];
        this.total = 0;
        this.loadingPackages = false;
      },
    });
  }

  onFilterChange(): void {
    this.pageIndex = 1;
    this.applyClientFilters();
  }

  clearFilters(): void {
    this.searchText = '';
    this.pageIndex = 1;
    this.applyClientFilters();
  }

  onPageChange(params: TableQueryParams): void {
    this.pageIndex = params.pageIndex;
    this.pageSize = params.pageSize;
    this.applyPagination();
  }

  openPackageDetail(pkg: InvestmentPackage): void {
    this.selectedPackage = pkg;
  }

  closePackageDetail(): void {
    this.selectedPackage = null;
  }

  openPublicGallery(pkg: InvestmentPackage): void {
    const plotId = pkg.farmPlot?.id;
    if (!plotId) {
      return;
    }

    this.galleryTitle = `${pkg.farmPlot?.title || pkg.title} Gallery`;
    this.showGalleryModal = true;
    this.galleryLoading = true;
    this.galleryImageUrls = [];

    this.farmPlotService.getPublicFarmPlotGalleryByPlotId(plotId).subscribe({
      next: (gallery) => {
        this.galleryImageUrls = gallery
          .map((item) => (item.imageUuid ? `${this.storageApiUrl}/${item.imageUuid}` : null))
          .filter((url): url is string => !!url);
        this.galleryLoading = false;
      },
      error: () => {
        this.galleryLoading = false;
        this.galleryImageUrls = [];
      },
    });
  }

  onGalleryVisibilityChange(visible: boolean): void {
    this.showGalleryModal = visible;
    if (!visible) {
      this.galleryLoading = false;
      this.galleryImageUrls = [];
    }
  }

  goToLeases(): void {
    void this.router.navigateByUrl('/investment-package-types/leasing');
  }

  private applyClientFilters(): void {
    const search = this.searchText.trim().toLowerCase();
    this.filteredPackages = this.packages.filter((pkg) => {
      const matchesSearch =
        !search ||
        pkg.title.toLowerCase().includes(search) ||
        (pkg.farmPlot?.title ?? '').toLowerCase().includes(search) ||
        (pkg.farmPlot?.description ?? '').toLowerCase().includes(search) ||
        (pkg.remark ?? '').toLowerCase().includes(search);
      return matchesSearch;
    });
    this.total = this.filteredPackages.length;
    this.applyPagination();
  }

  private applyPagination(): void {
    const startIndex = (this.pageIndex - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedPackages = this.filteredPackages.slice(startIndex, endIndex);
  }

  private formatAmount(value: number | undefined): string {
    if (value === undefined || value === null) {
      return '-';
    }
    return new Intl.NumberFormat(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(value);
  }
}
