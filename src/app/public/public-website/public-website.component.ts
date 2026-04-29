import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FarmPlotFilterComponent } from '../../features/farm-plots/pages/farm-plot-filter/farm-plot-filter.component';
import { SharedModule } from '../../shared/shared.module';
import { FarmPlot, FarmPlotSizeType, FarmPlotSoilType, FarmPlotStatus } from '../../features/farm-plots/models/farm-plot.model';
import { FarmPlotService } from '../../features/farm-plots/services/farm-plot.service';
import { CompanyProfile } from '../../features/farm-company/models/company-profile.model';
import { CompanyProfileService } from '../../features/farm-company/services/company-profile.service';
import { TableQueryParams } from '../../shared/data-table/models/table-query-params.model';
import { PageResponse } from '../../shared/models/api-response.model';
import { OssMapComponent } from '../../shared/oss-map/oss-map.component';
import { environment } from '../../../environments/environment';
import { RequestType } from '../../core/services/http.service';
import { ImageGalleryModalComponent } from '../../shared/modals/image-gallery-modal/image-gallery-modal.component';
import { PublicHeaderComponent } from '../public-header/public-header.component';

@Component({
  selector: 'app-public-website',
  standalone: true,
  imports: [CommonModule, RouterModule, FarmPlotFilterComponent, SharedModule, OssMapComponent, ImageGalleryModalComponent, PublicHeaderComponent],
  templateUrl: './public-website.component.html',
  styleUrls: ['./public-website.component.css'],
})
export class PublicWebsiteComponent implements OnInit {
  private readonly storageApiUrl = `${environment.apiUrl}/files`;
  private readonly initialLoadSize = 500;

  plots: FarmPlot[] = [];
  filteredPlots: FarmPlot[] = [];
  pagedPlots: FarmPlot[] = [];
  company: CompanyProfile | null = null;
  selectedPlot: FarmPlot | null = null;

  loadingPlots = false;
  loadingCompany = false;
  galleryLoading = false;
  showGalleryModal = false;
  galleryImageUrls: string[] = [];
  galleryTitle = 'Farm Plot Gallery';

  total = 0;
  pageIndex = 1;
  pageSize = 10;

  searchText = '';
  status: FarmPlotStatus | '' = '';
  soilType: FarmPlotSoilType | '' = '';
  sizeType: FarmPlotSizeType | '' = '';

  readonly getPlotCardTitle = (plot: FarmPlot): string => plot.title;
  readonly getPlotThumbnailAlt = (plot: FarmPlot): string => `${plot.title} thumbnail`;
  readonly getPlotThumbnailUrl = (plot: FarmPlot): string | null =>
    plot.imageUuid ? `${this.storageApiUrl}/${plot.imageUuid}` : null;
  readonly getPublicCardSubtitle = (plot: FarmPlot): string =>
    `${plot.size} ${plot.sizeType} • ${plot.soilType.toLowerCase()} soil`;
  readonly getPublicCardDescription = (plot: FarmPlot): string =>
    plot.description || 'Discover this scenic farm plot and reserve your visit today.';
  readonly getPublicCardBadges = (plot: FarmPlot): string[] => [
    plot.status === 'ACTIVE' ? 'Guest Favorite' : plot.status.replaceAll('_', ' '),
    `${plot.sizeType === 'HECTARES' ? 'H' : 'A'} ${plot.size}`,
  ];

  constructor(
    private farmPlotService: FarmPlotService,
    private companyProfileService: CompanyProfileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPlots();
    this.loadCompany();
  }

  loadPlots(): void {
    this.loadingPlots = true;
    this.farmPlotService.getPublicActiveFarmPlots(0, this.initialLoadSize).subscribe({
      next: (response: PageResponse<FarmPlot>) => {
        this.plots = response.content ?? [];
        this.applyClientFilters();
        this.loadingPlots = false;
      },
      error: () => {
        this.plots = [];
        this.filteredPlots = [];
        this.pagedPlots = [];
        this.total = 0;
        this.loadingPlots = false;
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
    this.status = '';
    this.soilType = '';
    this.sizeType = '';
    this.pageIndex = 1;
    this.applyClientFilters();
  }

  onPageChange(params: TableQueryParams): void {
    this.pageIndex = params.pageIndex;
    this.pageSize = params.pageSize;
    this.applyPagination();
  }

  openPlotDetail(plot: FarmPlot): void {
    this.selectedPlot = plot;
  }

  openPublicGallery(plot: FarmPlot): void {
    this.galleryTitle = `${plot.title} Gallery`;
    this.showGalleryModal = true;
    this.galleryLoading = true;
    this.galleryImageUrls = [];

    this.farmPlotService.getPublicFarmPlotGallery(plot.id).subscribe({
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

  closePlotDetail(): void {
    this.selectedPlot = null;
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
    this.filteredPlots = this.plots.filter((plot) => {
      const matchesSearch =
        !search ||
        plot.title.toLowerCase().includes(search) ||
        (plot.description ?? '').toLowerCase().includes(search);
      const matchesStatus = !this.status || plot.status === this.status;
      const matchesSoilType = !this.soilType || plot.soilType === this.soilType;
      const matchesSizeType = !this.sizeType || plot.sizeType === this.sizeType;
      return matchesSearch && matchesStatus && matchesSoilType && matchesSizeType;
    });
    this.total = this.filteredPlots.length;
    this.applyPagination();
  }

  private applyPagination(): void {
    const startIndex = (this.pageIndex - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedPlots = this.filteredPlots.slice(startIndex, endIndex);
  }
}
