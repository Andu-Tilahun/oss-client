import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {Woreda} from '../../models/woreda.model';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {WoredaService} from '../../services/woreda.service';
import {TableQueryParams} from '../../../../shared/data-table/models/table-query-params.model';
import {PageResponse} from '../../../../shared/models/api-response.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {WoredaFilterRequest} from '../woreda-filter/woreda-filter-request';

@Component({
  selector: 'app-woreda-list',
  standalone: false,
  templateUrl: './woreda-list.component.html',
  styleUrl: './woreda-list.component.css'
})
export class WoredaListComponent {
  woredas: Woreda[] = [];
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
  selectedWoreda: Woreda | null = null;

  columns: DataTableColumn<Woreda>[] = [
    {header: 'Name', value: (w) => w.name},
    {header: 'Subcity/Zone', value: (w) => w.subcityName}
  ];

  constructor(
    private woredaService: WoredaService,
    private toastService: ToastService,
    private router: Router
  ) {}

  onView(woreda: Woreda): void {
    this.router.navigate(['/woredas', woreda.id]);
  }

  ngOnInit() {
    this.loadWoredas();
  }

  loadWoredas() {
    this.loading = true;
    const filterRequest: WoredaFilterRequest = this.buildFilterRequest();
    this.woredaService.filterWoredas(filterRequest).subscribe({
      next: (response: PageResponse<Woreda>) => {
        if (response) {
          this.woredas = response.content;
          this.total = response.totalElements;
          this.loading = false;
          this.toastService.success(`Woredas retrieved successfully`);
        }
      },
      error: (error) => {
        this.toastService.error(
          error.message || 'Failed to fetch woredas',
          'Fetch Woredas'
        );
        this.loading = false;
      }
    });
  }

  onPageChange(params: TableQueryParams) {
    this.pageIndex = params.pageIndex;
    this.currentPage = this.pageIndex - 1;
    this.pageSize = params.pageSize;
    this.loadWoredas();
  }

  onAdd() {
    this.showCreateModal = true;
  }

  onRefresh() {
    this.loadWoredas();
  }

  onSearch() {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadWoredas();
  }

  clearFilters() {
    this.searchText = '';
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadWoredas();
  }

  onEdit(woreda: Woreda) {
    this.selectedWoreda = woreda;
    this.showEditModal = true;
  }

  onDelete(woreda: Woreda) {
    this.selectedWoreda = woreda;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.selectedWoreda) return;

    this.woredaService.deleteWoreda(this.selectedWoreda.id).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.selectedWoreda = null;
        this.loadWoredas();
      },
      error: (error) => {
        console.error('Error deleting woreda:', error);
        this.toastService.error(
          error.message || 'Failed to delete woreda',
          'Delete Woreda'
        );
      }
    });
  }

  onWoredaCreated() {
    this.loadWoredas();
  }

  onWoredaUpdated() {
    this.loadWoredas();
  }

  private buildFilterRequest(): WoredaFilterRequest {
    return {
      searchText: this.searchText || undefined,
      sortBy: 'name',
      sortDirection: 'ASC',
      page: this.currentPage,
      size: this.pageSize
    };
  }
}

