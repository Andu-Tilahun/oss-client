import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {Organization, OrganizationType} from '../../models/organization.model';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {OrganizationService} from '../../services/organization.service';
import {TableQueryParams} from '../../../../shared/data-table/models/table-query-params.model';
import {PageResponse} from '../../../../shared/models/api-response.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {OrganizationFilterRequest} from '../organization-filter/organization-filter-request';

@Component({
  selector: 'app-organization-list',
  standalone: false,
  templateUrl: './organization-list.component.html',
  styleUrl: './organization-list.component.css'
})
export class OrganizationListComponent {
  organizations: Organization[] = [];
  loading = false;
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  currentPage = 0;

  // Filters
  searchText = '';
  selectedTypes: OrganizationType[] = [];

  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedOrganization: Organization | null = null;

  columns: DataTableColumn<Organization>[] = [
    {header: 'Name', value: (o) => o.name},
    {header: 'Type', value: (o) => o.organizationType}
  ];

  constructor(
    private organizationService: OrganizationService,
    private toastService: ToastService,
    private router: Router
  ) {}

  onView(organization: Organization): void {
    this.router.navigate(['/organizations', organization.id]);
  }

  ngOnInit() {
    this.loadOrganizations();
  }

  loadOrganizations() {
    this.loading = true;
    const filterRequest: OrganizationFilterRequest = this.buildFilterRequest();
    this.organizationService.filterOrganizations(filterRequest).subscribe({
      next: (response: PageResponse<Organization>) => {
        if (response) {
          this.organizations = response.content;
          this.total = response.totalElements;
          this.loading = false;
          this.toastService.success(`Organizations retrieved successfully`);
        }
      },
      error: (error) => {
        this.toastService.error(
          error.message || 'Failed to fetch organizations',
          'Fetch Organizations'
        );
        this.loading = false;
      }
    });
  }

  onPageChange(params: TableQueryParams) {
    this.pageIndex = params.pageIndex;
    this.currentPage = this.pageIndex - 1;
    this.pageSize = params.pageSize;
    this.loadOrganizations();
  }

  onAdd() {
    this.showCreateModal = true;
  }

  onRefresh() {
    this.loadOrganizations();
  }

  onSearch() {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadOrganizations();
  }

  onFilterChange() {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadOrganizations();
  }

  clearFilters() {
    this.searchText = '';
    this.selectedTypes = [];
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadOrganizations();
  }

  onEdit(organization: Organization) {
    this.selectedOrganization = organization;
    this.showEditModal = true;
  }

  onDelete(organization: Organization) {
    this.selectedOrganization = organization;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.selectedOrganization) return;

    this.organizationService.deleteOrganization(this.selectedOrganization.id).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.selectedOrganization = null;
        this.loadOrganizations();
      },
      error: (error) => {
        console.error('Error deleting organization:', error);
        this.toastService.error(
          error.message || 'Failed to delete organization',
          'Delete Organization'
        );
      }
    });
  }

  onOrganizationCreated() {
    this.loadOrganizations();
  }

  onOrganizationUpdated() {
    this.loadOrganizations();
  }

  private buildFilterRequest(): OrganizationFilterRequest {
    return {
      searchText: this.searchText || undefined,
      types: this.selectedTypes && this.selectedTypes.length ? this.selectedTypes : undefined,
      sortBy: 'name',
      sortDirection: 'ASC',
      page: this.currentPage,
      size: this.pageSize
    };
  }
}
