import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {FarmPlot} from '../../models/farm-plot.model';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {ColumnType} from '../../../../shared/data-table/models/column-types.model';
import {FarmPlotService} from '../../services/farm-plot.service';
import {PageResponse} from '../../../../shared/models/api-response.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {TableQueryParams} from '../../../../shared/data-table/models/table-query-params.model';
import {FarmPlotFilterRequest, FarmPlotStatus, FarmPlotSizeType, FarmPlotSoilType} from '../../models/farm-plot.model';
import {FarmPlotCreateModalComponent} from '../../modals/farm-plot-create-modal/farm-plot-create-modal.component';
import {FarmPlotEditModalComponent} from '../../modals/farm-plot-edit-modal/farm-plot-edit-modal.component';
import {ConfirmationModalComponent} from '../../../../shared/modals/confirmation-modal/confirmation-modal.component';
import {FarmPlotFilterComponent} from '../farm-plot-filter/farm-plot-filter.component';
import {PageHeaderComponent} from '../../../../shared/components/page-header/page-header.component';
import {NgClass} from '@angular/common';
import {DataTableComponent} from '../../../../shared/data-table/data-table.component';

@Component({
  selector: 'app-farm-plot-list',
  standalone: false,
  templateUrl: './farm-plot-list.component.html',
  styleUrl: './farm-plot-list.component.css',
})
export class FarmPlotListComponent {
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

  columns: DataTableColumn<FarmPlot>[] = [
    {header: 'Title', value: (p) => p.title},
    {
      header: 'Size',
      value: (p) => `${p.size} ${p.sizeType}`,
    },
    {header: 'Soil Type', value: (p) => p.soilType},
    {header: 'Status', value: (p) => p.status},
  ];

  constructor(
    private farmPlotService: FarmPlotService,
    private toastService: ToastService,
    private router: Router
  ) {}

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

  onSearch(): void {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadPlots();
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
    this.showEditModal = true;
  }

  onDelete(plot: FarmPlot): void {
    this.selectedPlot = plot;
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
    this.loadPlots();
  }

  onFarmPlotUpdated(): void {
    this.loadPlots();
  }
}

