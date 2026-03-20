import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {Subcity} from '../../models/subcity.model';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {SubcityService} from '../../services/subcity.service';
import {TableQueryParams} from '../../../../shared/data-table/models/table-query-params.model';
import {PageResponse} from '../../../../shared/models/api-response.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {SubcityFilterRequest} from '../subcity-filter/subcity-filter-request';

@Component({
  selector: 'app-subcity-list',
  standalone: false,
  templateUrl: './subcity-list.component.html',
  styleUrl: './subcity-list.component.css'
})
export class SubcityListComponent {
  subcities: Subcity[] = [];
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
  selectedSubcity: Subcity | null = null;

  columns: DataTableColumn<Subcity>[] = [
    {header: 'Name', value: (s) => s.name},
    {header: 'Region', value: (s) => s.regionName}
  ];

  constructor(
    private subcityService: SubcityService,
    private toastService: ToastService,
    private router: Router
  ) {}

  onView(subcity: Subcity): void {
    this.router.navigate(['/subcities', subcity.id]);
  }

  ngOnInit() {
    this.loadSubcities();
  }

  loadSubcities() {
    this.loading = true;
    const filterRequest: SubcityFilterRequest = this.buildFilterRequest();
    this.subcityService.filterSubcities(filterRequest).subscribe({
      next: (response: PageResponse<Subcity>) => {
        if (response) {
          this.subcities = response.content;
          this.total = response.totalElements;
          this.loading = false;
          this.toastService.success(`Subcities/Zones retrieved successfully`);
        }
      },
      error: (error) => {
        this.toastService.error(
          error.message || 'Failed to fetch subcities/zones',
          'Fetch Subcities/Zones'
        );
        this.loading = false;
      }
    });
  }

  onPageChange(params: TableQueryParams) {
    this.pageIndex = params.pageIndex;
    this.currentPage = this.pageIndex - 1;
    this.pageSize = params.pageSize;
    this.loadSubcities();
  }

  onAdd() {
    this.showCreateModal = true;
  }

  onRefresh() {
    this.loadSubcities();
  }

  onSearch() {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadSubcities();
  }

  clearFilters() {
    this.searchText = '';
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadSubcities();
  }

  onEdit(subcity: Subcity) {
    this.selectedSubcity = subcity;
    this.showEditModal = true;
  }

  onDelete(subcity: Subcity) {
    this.selectedSubcity = subcity;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.selectedSubcity) return;

    this.subcityService.deleteSubcity(this.selectedSubcity.id).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.selectedSubcity = null;
        this.loadSubcities();
      },
      error: (error) => {
        console.error('Error deleting subcity/zone:', error);
        this.toastService.error(
          error.message || 'Failed to delete subcity/zone',
          'Delete Subcity/Zone'
        );
      }
    });
  }

  onSubcityCreated() {
    this.loadSubcities();
  }

  onSubcityUpdated() {
    this.loadSubcities();
  }

  private buildFilterRequest(): SubcityFilterRequest {
    return {
      searchText: this.searchText || undefined,
      sortBy: 'name',
      sortDirection: 'ASC',
      page: this.currentPage,
      size: this.pageSize
    };
  }
}

