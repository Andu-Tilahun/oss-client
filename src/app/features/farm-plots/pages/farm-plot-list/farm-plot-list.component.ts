import {Component} from '@angular/core';
import {
  FarmGallery,
  FarmPlot,
  FarmPlotFilterRequest,
  FarmPlotMaintenanceRequest,
  FarmPlotSizeType,
  FarmPlotSoilType,
  FarmPlotStatus
} from '../../models/farm-plot.model';
import {FarmPlotService} from '../../services/farm-plot.service';
import {PageResponse} from '../../../../shared/models/api-response.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {TableQueryParams} from '../../../../shared/data-table/models/table-query-params.model';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {TabItem} from '../../../../shared/tabs/models/tab-item.model';
import {environment} from '../../../../../environments/environment';
import {RegionService} from '../../../regions/services/region.service';
import {PageSplitRightAction} from '../../../../shared/components/page-split-layout/page-split-layout/page-split-right-action.model';

@Component({
  selector: 'app-farm-plot-list',
  standalone: false,
  templateUrl: './farm-plot-list.component.html',
  styleUrl: './farm-plot-list.component.css',
})
export class FarmPlotListComponent {
  private readonly storageApiUrl = `${environment.apiUrl}/files`;

  regionsMap = new Map<string, string>();

  operationalPlots: FarmPlot[] = [];
  operationalLoading = false;
  operationalTotal = 0;
  operationalPageSize = 10;
  operationalPageIndex = 1;

  repairPlots: FarmPlot[] = [];
  repairLoading = false;
  repairTotal = 0;
  repairPageSize = 10;
  repairPageIndex = 1;

  archivedPlots: FarmPlot[] = [];
  archivedLoading = false;
  archivedTotal = 0;
  archivedPageSize = 10;
  archivedPageIndex = 1;

  adminActiveTab = 'operational';
  adminTabs: TabItem[] = [
    {key: 'operational', label: 'Operational'},
    {key: 'repair', label: 'Repair / Damaged'},
    {key: 'archived', label: 'Archived'},
  ];

  // Search & filters
  searchText = '';
  status: FarmPlotStatus | '' = '';
  soilType: FarmPlotSoilType | '' = '';
  sizeType: FarmPlotSizeType | '' = '';

  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showMaintenanceModal = false;
  maintenanceSubmitting = false;
  maintenanceReason = '';
  showRepairModal = false;
  repairSubmitting = false;
  showGalleryModal = false;
  galleryLoading = false;
  galleryImageUrls: string[] = [];
  galleryTitle = 'Farm Plot Gallery';

  selectedPlot: FarmPlot | null = null;

  // Forces the right-side detail component to reload after updates.
  detailRefreshKey = 0;

  columns: DataTableColumn<FarmPlot>[] = [
    {
      header: 'Title',
      value: (plot) => plot.title,
      defaultVisible: true,
    },
    {
      header: 'Size',
      value: (plot) => `${plot.size} ${plot.sizeType}`,
      defaultVisible: true,
    },
    {
      header: 'Soil Type',
      value: (plot) => plot.soilType,
      defaultVisible: true,
    },
    {
      header: 'Region',
      value: (plot) => this.regionsMap.get(plot.regionId ?? '') ?? '—',
      defaultVisible: true,
    },
  ];

  repairColumns: DataTableColumn<FarmPlot>[] = [
    ...this.columns,
    {
      header: 'Reason',
      value: (plot) => plot.maintenanceReason ?? '-',
      defaultVisible: true,
    },
  ];

  tableRowActions: PageSplitRightAction<FarmPlot>[] = [
    {
      id: 'edit',
      icon: 'edit',
      title: 'Edit',
      visible: (p) => p.status !== 'ASSIGNED_TO_LEASE' && p.status !== 'ASSIGNED_TO_INVESTMENT_PACKAGE',
      action: (p) => this.onEdit(p),
    },
    {
      id: 'delete',
      icon: 'delete',
      title: 'Deactivate',
      visible: (p) => p.status !== 'ASSIGNED_TO_LEASE' && p.status !== 'ASSIGNED_TO_INVESTMENT_PACKAGE',
      action: (p) => this.onDeactivate(p),
    },
    {
      id: 'mark-under-maintenance',
      icon: 'ban',
      title: 'Mark Under Maintenance',
      visible: (p) => p.status === 'ACTIVE',
      action: (p) => this.onMarkUnderMaintenance(p),
    },
  ];

  repairRowActions: PageSplitRightAction<FarmPlot>[] = [
    {
      id: 'mark-repaired',
      icon: 'check',
      title: 'Mark Repaired',
      visible: () => true,
      action: (p) => this.onMarkRepaired(p),
    },
  ];

  get checkIfPlotIsNotAssigned(): boolean {
    return this.selectedPlot?.status !== 'ASSIGNED_TO_LEASE'
      && this.selectedPlot?.status !== 'ASSIGNED_TO_INVESTMENT_PACKAGE';
  }

  constructor(
    private farmPlotService: FarmPlotService,
    private toastService: ToastService,
    private regionService: RegionService,
  ) {
  }

  ngOnInit(): void {
    this.regionService.filterRegions({ page: 0, size: 100 }).subscribe({
      next: (res) => {
        this.regionsMap = new Map((res.content ?? []).map(r => [r.id, r.name]));
      },
    });
    this.refreshCurrentTab();
  }

  onAdminTabChange(key: string): void {
    this.adminActiveTab = key;
    this.refreshCurrentTab();
  }

  /** Single entry point for every initial load and post-mutation refresh; dispatches to
   *  whichever tab is currently active so the other tabs reload lazily on next visit. */
  refreshCurrentTab(previousId?: string | null): void {
    if (this.adminActiveTab === 'repair') {
      this.loadRepair(previousId);
    } else if (this.adminActiveTab === 'archived') {
      this.loadArchived(previousId);
    } else {
      this.loadOperational(previousId);
    }
  }

  private buildFilterRequest(page: number, size: number): FarmPlotFilterRequest {
    return {
      searchText: this.searchText || undefined,
      statuses: this.status ? [this.status] : undefined,
      soilTypes: this.soilType ? [this.soilType] : undefined,
      sizeTypes: this.sizeType ? [this.sizeType] : undefined,
      sortBy: 'title',
      sortDirection: 'ASC',
      page,
      size,
    };
  }

  loadOperational(previousId?: string | null): void {
    this.operationalLoading = true;
    const request = this.buildFilterRequest(this.operationalPageIndex - 1, this.operationalPageSize);
    this.farmPlotService.filterOperationalFarmPlots(request).subscribe({
      next: (response: PageResponse<FarmPlot>) => {
        this.operationalPlots = response.content ?? [];
        this.operationalTotal = response.totalElements ?? this.operationalPlots.length;
        this.operationalLoading = false;
        if (this.adminActiveTab !== 'operational') return;
        this.selectFromList(this.operationalPlots, previousId);
      },
      error: () => {
        this.operationalLoading = false;
      },
    });
  }

  loadRepair(previousId?: string | null): void {
    this.repairLoading = true;
    const request = this.buildFilterRequest(this.repairPageIndex - 1, this.repairPageSize);
    this.farmPlotService.filterRepairFarmPlots(request).subscribe({
      next: (response: PageResponse<FarmPlot>) => {
        this.repairPlots = response.content ?? [];
        this.repairTotal = response.totalElements ?? this.repairPlots.length;
        this.repairLoading = false;
        if (this.adminActiveTab !== 'repair') return;
        this.selectFromList(this.repairPlots, previousId);
      },
      error: () => {
        this.repairLoading = false;
      },
    });
  }

  loadArchived(previousId?: string | null): void {
    this.archivedLoading = true;
    const request = this.buildFilterRequest(this.archivedPageIndex - 1, this.archivedPageSize);
    this.farmPlotService.filterArchivedFarmPlots(request).subscribe({
      next: (response: PageResponse<FarmPlot>) => {
        this.archivedPlots = response.content ?? [];
        this.archivedTotal = response.totalElements ?? this.archivedPlots.length;
        this.archivedLoading = false;
        if (this.adminActiveTab !== 'archived') return;
        this.selectFromList(this.archivedPlots, previousId);
      },
      error: () => {
        this.archivedLoading = false;
      },
    });
  }

  private selectFromList(list: FarmPlot[], previousId?: string | null): void {
    if (previousId) {
      const match = list.find((p) => p.id === previousId);
      if (match) {
        this.selectedPlot = {...match};
        return;
      }
    }
    this.selectedPlot = list.length > 0 ? {...list[0]} : null;
    if (this.selectedPlot) this.detailRefreshKey++;
  }

  onOperationalPageChange(params: TableQueryParams): void {
    this.operationalPageIndex = params.pageIndex;
    this.operationalPageSize = params.pageSize;
    this.loadOperational();
  }

  onRepairPageChange(params: TableQueryParams): void {
    this.repairPageIndex = params.pageIndex;
    this.repairPageSize = params.pageSize;
    this.loadRepair();
  }

  onArchivedPageChange(params: TableQueryParams): void {
    this.archivedPageIndex = params.pageIndex;
    this.archivedPageSize = params.pageSize;
    this.loadArchived();
  }

  private resetActiveTabPaging(): void {
    if (this.adminActiveTab === 'repair') {
      this.repairPageIndex = 1;
    } else if (this.adminActiveTab === 'archived') {
      this.archivedPageIndex = 1;
    } else {
      this.operationalPageIndex = 1;
    }
  }

  onAdd(): void {
    this.showCreateModal = true;
  }

  onRefresh(): void {
    this.refreshCurrentTab(this.selectedPlot?.id);
  }

  onDownload(): void {
    this.toastService.info('Farm plot download is not implemented yet', 'Download Farm Plots');
  }

  onSearch(): void {
    this.resetActiveTabPaging();
    this.refreshCurrentTab();
  }

  onFilterChange(): void {
    this.onSearch();
  }

  clearFilters(): void {
    this.searchText = '';
    this.status = '';
    this.soilType = '';
    this.sizeType = '';
    this.resetActiveTabPaging();
    this.refreshCurrentTab();
  }

  onEdit(plot: FarmPlot): void {
    this.farmPlotService.getFarmPlotGallery(plot.id).subscribe({
      next: (gallery) => {
        this.selectedPlot = {...plot, gallery};
        this.showDeleteModal = false;
        this.showEditModal = true;
      },
      error: () => {},
    });
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

  onDeactivate(plot: FarmPlot): void {
    this.selectedPlot = plot;
    this.showEditModal = false;
    this.showDeleteModal = true;
  }

  confirmDeactivate(): void {
    if (!this.selectedPlot) return;
    this.farmPlotService.deactivateFarmPlot(this.selectedPlot.id).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.selectedPlot = null;
        this.refreshCurrentTab();
        this.toastService.success('Farm plot deactivated successfully');
      },
      error: () => {},
    });
  }

  onMarkUnderMaintenance(plot: FarmPlot): void {
    this.selectedPlot = plot;
    this.maintenanceReason = '';
    this.showMaintenanceModal = true;
  }

  handleMaintenanceConfirm(): void {
    if (!this.selectedPlot?.id || !this.maintenanceReason.trim()) return;
    this.maintenanceSubmitting = true;
    const request: FarmPlotMaintenanceRequest = {reason: this.maintenanceReason.trim()};
    this.farmPlotService.markUnderMaintenance(this.selectedPlot.id, request).subscribe({
      next: () => {
        this.maintenanceSubmitting = false;
        this.showMaintenanceModal = false;
        this.toastService.success('Farm plot marked under maintenance');
        this.refreshCurrentTab();
      },
      error: (err) => {
        this.maintenanceSubmitting = false;
        this.toastService.error(err.message || 'Failed to update farm plot', 'Mark Under Maintenance');
      },
    });
  }

  onMarkRepaired(plot: FarmPlot): void {
    this.selectedPlot = plot;
    this.showRepairModal = true;
  }

  confirmMarkRepaired(): void {
    if (!this.selectedPlot?.id) return;
    this.repairSubmitting = true;
    this.farmPlotService.markRepaired(this.selectedPlot.id).subscribe({
      next: () => {
        this.repairSubmitting = false;
        this.showRepairModal = false;
        this.toastService.success('Farm plot marked as repaired');
        this.refreshCurrentTab();
      },
      error: (err) => {
        this.repairSubmitting = false;
        this.toastService.error(err.message || 'Failed to update farm plot', 'Mark Repaired');
      },
    });
  }

  onFarmPlotCreated(): void {
    this.detailRefreshKey++;
    this.refreshCurrentTab(this.selectedPlot?.id);
  }

  onFarmPlotUpdated(): void {
    this.detailRefreshKey++;
    this.refreshCurrentTab(this.selectedPlot?.id);
  }

  onOpenGallery(plot: FarmPlot): void {
    this.galleryTitle = `${plot.title} Gallery`;
    this.showGalleryModal = true;
    this.galleryLoading = true;
    this.galleryImageUrls = [];

    this.farmPlotService.getFarmPlotGallery(plot.id).subscribe({
      next: (gallery: FarmGallery[]) => {
        this.galleryImageUrls = gallery
          .map((item) => this.toStorageUrl(item.imageUuid))
          .filter((url): url is string => !!url);
        this.galleryLoading = false;
      },
      error: () => {
        this.galleryLoading = false;
      },
    });
  }

  onGalleryVisibilityChange(visible: boolean): void {
    this.showGalleryModal = visible;
    if (!visible) {
      this.galleryImageUrls = [];
      this.galleryLoading = false;
    }
  }

  private toStorageUrl(imageUuid?: string): string | null {
    return imageUuid ? `${this.storageApiUrl}/${imageUuid}` : null;
  }
}

