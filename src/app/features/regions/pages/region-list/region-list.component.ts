import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {Region} from '../../models/region.model';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {RegionService} from '../../services/region.service';
import {TableQueryParams} from '../../../../shared/data-table/models/table-query-params.model';
import {PageResponse} from '../../../../shared/models/api-response.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {RegionFilterRequest} from '../region-filter/region-filter-request';

@Component({
  selector: 'app-region-list',
  standalone: false,
  templateUrl: './region-list.component.html',
  styleUrl: './region-list.component.css'
})
export class RegionListComponent {
  regions: Region[] = [];
  loading = false;
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  currentPage = 0;

  // Search
  searchText = '';

  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedRegion: Region | null = null;

  columns: DataTableColumn<Region>[] = [
    {header: 'Name', value: (r) => r.name}
  ];

  constructor(
    private regionService: RegionService,
    private toastService: ToastService,
    private router: Router
  ) {}

  onView(region: Region): void {
    this.router.navigate(['/regions', region.id]);
  }

  ngOnInit() {
    this.loadRegions();
  }

  loadRegions() {
    this.loading = true;
    const filterRequest: RegionFilterRequest = this.buildFilterRequest();
    this.regionService.filterRegions(filterRequest).subscribe({
      next: (response: PageResponse<Region>) => {
        if (response) {
          this.regions = response.content;
          this.total = response.totalElements;
          this.loading = false;
          this.toastService.success(`Regions retrieved successfully`);
        }
      },
      error: (error) => {
        this.toastService.error(
          error.message || 'Failed to fetch regions',
          'Fetch Regions'
        );
        this.loading = false;
      }
    });
  }

  onPageChange(params: TableQueryParams) {
    this.pageIndex = params.pageIndex;
    this.currentPage = this.pageIndex - 1;
    this.pageSize = params.pageSize;
    this.loadRegions();
  }

  onAdd() {
    this.showCreateModal = true;
  }

  onRefresh() {
    this.loadRegions();
  }

  onSearch() {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadRegions();
  }

  clearFilters() {
    this.searchText = '';
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadRegions();
  }

  onEdit(region: Region) {
    this.selectedRegion = region;
    this.showEditModal = true;
  }

  onDelete(region: Region) {
    this.selectedRegion = region;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.selectedRegion) return;

    this.regionService.deleteRegion(this.selectedRegion.id).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.selectedRegion = null;
        this.loadRegions();
      },
      error: (error) => {
        console.error('Error deleting region:', error);
        this.toastService.error(
          error.message || 'Failed to delete region',
          'Delete Region'
        );
      }
    });
  }

  onRegionCreated() {
    this.loadRegions();
  }

  onRegionUpdated() {
    this.loadRegions();
  }

  private buildFilterRequest(): RegionFilterRequest {
    return {
      searchText: this.searchText || undefined,
      sortBy: 'name',
      sortDirection: 'ASC',
      page: this.currentPage,
      size: this.pageSize
    };
  }
}
