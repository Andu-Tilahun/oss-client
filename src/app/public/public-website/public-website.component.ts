import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CompanyProfile } from '../../features/farm-company/models/company-profile.model';
import { CompanyProfileService } from '../../features/farm-company/services/company-profile.service';
import { TableQueryParams } from '../../shared/data-table/models/table-query-params.model';
import { PageResponse } from '../../shared/models/api-response.model';
import { environment } from '../../../environments/environment';
import { RequestType } from '../../core/services/http.service';
import { ImageGalleryModalComponent } from '../../shared/modals/image-gallery-modal/image-gallery-modal.component';
import { PublicHeaderComponent } from '../public-header/public-header.component';
import { PublicHeroComponent } from '../public-hero/public-hero.component';
import { PublicAboutUsComponent } from '../public-about-us/public-about-us.component';
import { PublicContactComponent } from '../public-contact/public-contact.component';
import { PublicFooterComponent } from '../public-footer/public-footer.component';
import { PublicDrawerComponent } from '../public-drawer/public-drawer.component';
import { PublicPlotsComponent } from '../public-plots/public-plots.component';
import { PublicNewsComponent } from '../public-news/public-news.component';
import { PublicGalleryComponent } from '../public-gallery/public-gallery.component';
import { InvestmentPackage } from '../../features/investment-package/models/investment-package.model';
import { InvestmentPackageService } from '../../features/investment-package/services/investment-package.service';
import { FarmPlotService } from '../../features/farm-plots/services/farm-plot.service';

@Component({
  selector: 'app-public-website',
  standalone: true,
  imports: [CommonModule, RouterModule, ImageGalleryModalComponent, PublicHeaderComponent, PublicHeroComponent, PublicAboutUsComponent, PublicContactComponent, PublicFooterComponent, PublicDrawerComponent, PublicPlotsComponent, PublicNewsComponent, PublicGalleryComponent],
  templateUrl: './public-website.component.html',
  styleUrls: ['./public-website.component.css'],
})
export class PublicWebsiteComponent implements OnInit, OnDestroy {
  private readonly storageApiUrl = `${environment.apiUrl}/files`;
  private readonly initialLoadSize = 500;
  private fragmentSubscription?: { unsubscribe: () => void };

  packages: InvestmentPackage[] = [];
  filteredPackages: InvestmentPackage[] = [];
  pagedPackages: InvestmentPackage[] = [];
  company: CompanyProfile | null = null;
  selectedPackage: InvestmentPackage | null = null;

  loadingPackages = false;
  loadingCompany = false;
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
    private companyProfileService: CompanyProfileService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadPackages();
    this.loadCompany();
    this.fragmentSubscription = this.route.fragment.subscribe((fragment) => {
      if (!fragment) {
        return;
      }
      setTimeout(() => this.scrollTo(fragment), 0);
    });
  }

  ngOnDestroy(): void {
    this.fragmentSubscription?.unsubscribe();
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

  loadCompany(): void {
    this.loadingCompany = true;
    this.companyProfileService.getCompanyProfile({
      requestType: RequestType.LOCAL,
      skipAuthRedirect: true,
    }).subscribe({
      next: (company) => {
        this.company = company;
        this.loadingCompany = false;
      },
      error: () => {
        this.company = null;
        this.loadingCompany = false;
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

  closePackageDetail(): void {
    this.selectedPackage = null;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  scrollTo(sectionId: string): void {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if ((sectionId === 'contact' || sectionId === 'about') && !this.company && !this.loadingCompany) {
      this.loadCompany();
    }
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
