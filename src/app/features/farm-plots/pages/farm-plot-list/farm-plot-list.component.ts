import {Component} from '@angular/core';
import {
  FarmPlot,
  FarmPlotFilterRequest,
  FarmPlotSizeType,
  FarmPlotSoilType,
  FarmPlotStatus
} from '../../models/farm-plot.model';
import {FarmPlotService} from '../../services/farm-plot.service';
import {PageResponse} from '../../../../shared/models/api-response.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {TableQueryParams} from '../../../../shared/data-table/models/table-query-params.model';
import {environment} from '../../../../../environments/environment';

@Component({
  selector: 'app-farm-plot-list',
  standalone: false,
  templateUrl: './farm-plot-list.component.html',
  styleUrl: './farm-plot-list.component.css',
})
export class FarmPlotListComponent {
  private readonly storageApiUrl = `${environment.apiUrl}/files`;

  plots: FarmPlot[] = [];
  loading = false;
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  currentPage = 0;

  // Search & filters
  searchText = '';
  status: FarmPlotStatus | '' = '';
  soilType: FarmPlotSoilType | '' = '';
  sizeType: FarmPlotSizeType | '' = '';

  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;

  selectedPlot: FarmPlot | null = null;

  // Forces the right-side detail component to reload after updates.
  detailRefreshKey = 0;

  readonly getPlotCardTitle = (plot: FarmPlot): string => plot.title;
  readonly getPlotCreatedDate = (plot: FarmPlot): Date | undefined => plot.createdAt;
  readonly getPlotThumbnailAlt = (plot: FarmPlot): string => `${plot.title} thumbnail`;
  readonly getPlotThumbnailUrl = (plot: FarmPlot): string | null =>
    plot.imageUuid ? `${this.storageApiUrl}/${plot.imageUuid}` : null;

  get checkIfPlotIsNotAssigned() {
    return true;
    // return this.selectedPlot?.status != 'ASSIGNED_TO_LEASE'
  }

  constructor(
    private farmPlotService: FarmPlotService,
    private toastService: ToastService
  ) {
  }

  ngOnInit(): void {
    this.loadPlots();
  }

  private buildFilterRequest(): FarmPlotFilterRequest {
    return {
      searchText: this.searchText || undefined,
      statuses: this.status ? [this.status] : undefined,
      soilTypes: this.soilType ? [this.soilType] : undefined,
      sizeTypes: this.sizeType ? [this.sizeType] : undefined,
      sortBy: 'title',
      sortDirection: 'ASC',
      page: this.currentPage,
      size: this.pageSize,
    };
  }

  loadPlots(): void {
    this.loading = true;
    const request: FarmPlotFilterRequest = this.buildFilterRequest();
    this.farmPlotService.filterFarmPlots(request).subscribe({
      next: (response: PageResponse<FarmPlot>) => {
        this.plots = response.content;
        this.total = response.totalElements;
        this.loading = false;
        this.toastService.success('Farm plots retrieved successfully');

        // Default selection: show first element only when nothing is selected.
        // If a plot was already selected, keep it if it still exists in the new page data.
        const previousSelectedId = this.selectedPlot?.id;

        if (this.plots.length === 0) {
          this.selectedPlot = null;
          return;
        }

        if (!previousSelectedId) {
          this.selectedPlot = {...this.plots[0]};
          this.detailRefreshKey++;
          return;
        }

        const match = this.plots.find((p) => p.id === previousSelectedId);
        if (match) {
          this.selectedPlot = {...match};
          return;
        }

        // Selected item is no longer in the list; fall back to the first item.
        this.selectedPlot = {...this.plots[0]};
        this.detailRefreshKey++;
      },
      error: (error) => {
        this.toastService.error(error.message || 'Failed to fetch farm plots', 'Fetch Farm Plots');
        this.loading = false;
      },
    });
  }

  onPageChange(params: TableQueryParams) {
    this.pageIndex = params.pageIndex;
    this.currentPage = this.pageIndex - 1;
    this.pageSize = params.pageSize;
    this.loadPlots();
  }

  onAdd(): void {
    this.showCreateModal = true;
  }

  onRefresh(): void {
    this.loadPlots();
  }

  onDownload(): void {
    this.toastService.info('Farm plot download is not implemented yet', 'Download Farm Plots');
  }

  onSearch(): void {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadPlots();
  }

  onFilterChange(): void {
    this.onSearch();
  }

  clearFilters(): void {
    this.searchText = '';
    this.status = '';
    this.soilType = '';
    this.sizeType = '';
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadPlots();
  }

  onEdit(plot: FarmPlot): void {
    this.selectedPlot = plot;
    this.showDeleteModal = false;
    this.showEditModal = true;
  }

  onView(plot: FarmPlot): void {
    // Clone to ensure the right-pane change detection sees a new object reference.
    this.selectedPlot = {...plot};
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
  }

  onCloseDetail(): void {
    this.selectedPlot = null;
    this.showEditModal = false;
    this.showDeleteModal = false;
  }

  onDelete(plot: FarmPlot): void {
    this.selectedPlot = plot;
    this.showEditModal = false;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.selectedPlot) return;
    this.farmPlotService.deleteFarmPlot(this.selectedPlot.id).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.selectedPlot = null;
        this.loadPlots();
        this.toastService.success('Farm plot deactivated successfully');
      },
      error: (error) => {
        this.toastService.error(error.message || 'Failed to deactivate farm plot', 'Deactivate Farm Plot');
      },
    });
  }

  onFarmPlotCreated(): void {
    this.detailRefreshKey++;
    this.loadPlots();
  }

  onFarmPlotUpdated(): void {
    this.detailRefreshKey++;
    this.loadPlots();
  }
}

