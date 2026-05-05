import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import {FarmPlot, FarmPlotSizeType, FarmPlotSoilType, FarmPlotStatus} from '../../models/farm-plot.model';
import {FarmPlotService} from '../../services/farm-plot.service';
import {TableQueryParams} from '../../../../shared/data-table/models/table-query-params.model';
import {PageResponse} from '../../../../shared/models/api-response.model';
import {environment} from '../../../../../environments/environment';
import {ImageGalleryModalComponent} from '../../../../shared/modals/image-gallery-modal/image-gallery-modal.component';
import {PublicDrawerComponent} from '../../../../public/public-drawer/public-drawer.component';
import {PublicPlotsComponent} from '../../../../public/public-plots/public-plots.component';

@Component({
  selector: 'app-farm-plots-explore-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ImageGalleryModalComponent, PublicDrawerComponent, PublicPlotsComponent],
  templateUrl: './farm-plots-explore-page.component.html',
})
export class FarmPlotsExplorePageComponent implements OnInit {
  private readonly storageApiUrl = `${environment.apiUrl}/files`;
  private readonly initialLoadSize = 500;

  plots: FarmPlot[] = [];
  filteredPlots: FarmPlot[] = [];
  pagedPlots: FarmPlot[] = [];
  selectedPlot: FarmPlot | null = null;

  loadingPlots = false;
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
    plot.status === 'ACTIVE' ? 'Featured' : plot.status.replaceAll('_', ' '),
    `${plot.sizeType === 'HECTARES' ? 'H' : 'A'} ${plot.size}`,
  ];

  constructor(
    private farmPlotService: FarmPlotService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.loadPlots();
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

  closePlotDetail(): void {
    this.selectedPlot = null;
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

  goToLeases(): void {
    void this.router.navigateByUrl('/farm-leases');
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
