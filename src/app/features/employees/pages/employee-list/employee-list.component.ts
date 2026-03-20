import { Component, OnInit } from '@angular/core';
import { DataTableColumn } from '../../../../shared/data-table/models/data-table-column.model';
import { TableQueryParams } from '../../../../shared/data-table/models/table-query-params.model';
import {
  Employee,
  EmployeeFilterRequest,
  EmployeeStatus,
} from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';
import { PageResponse } from '../../../../shared/models/api-response.model';
import { ToastService } from '../../../../shared/toast/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-employee-list',
  standalone: false,
  templateUrl: './employee-list.component.html',
})
export class EmployeeListComponent implements OnInit {
  employees: Employee[] = [];
  loading = false;
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  currentPage = 0;

  searchText = '';
  selectedStatuses: EmployeeStatus[] = [];
  selectedDepartmentId = '';

  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedEmployee: Employee | null = null;

  columns: DataTableColumn<Employee>[] = [
    { header: 'Employee Code', value: (e) => e.employeeCode },
    { header: 'Name', value: (e) => e.name },
    { header: 'Position', value: (e) => e.position ?? '-' },
    { header: 'Department', value: (e) => e.departmentName ?? '-' },
    { header: 'Status', value: (e) => e.status },
  ];

  constructor(
    private employeeService: EmployeeService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // this.loadEmployees();
  }

  loadEmployees(): void {
    this.loading = true;
    const request: EmployeeFilterRequest = this.buildFilterRequest();
    this.employeeService.filter(request).subscribe({
      next: (res: PageResponse<Employee>) => {
        this.employees = res?.content ?? [];
        this.total = res?.totalElements ?? 0;
        this.loading = false;
        this.toastService.success('Employees retrieved successfully');
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.message || 'Failed to fetch employees', 'Fetch Employees');
      },
    });
  }

  onPageChange(params: TableQueryParams): void {
    this.pageIndex = params.pageIndex;
    this.currentPage = this.pageIndex - 1;
    this.pageSize = params.pageSize;
    this.loadEmployees();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadEmployees();
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedStatuses = [];
    this.selectedDepartmentId = '';
    this.onFilterChange();
  }

  onAdd(): void {
    this.showCreateModal = true;
  }

  onRefresh(): void {
    this.loadEmployees();
  }

  onEdit(e: Employee): void {
    this.selectedEmployee = e;
    this.showEditModal = true;
  }

  onView(e: Employee): void {
    this.router.navigate(['/inventory/employees', e.id]);
  }

  onEmployeeCreated(): void {
    this.loadEmployees();
  }

  onEmployeeUpdated(): void {
    this.loadEmployees();
  }

  private buildFilterRequest(): EmployeeFilterRequest {
    return {
      searchText: this.searchText || undefined,
      statuses: this.selectedStatuses.length > 0 ? this.selectedStatuses : undefined,
      departmentId: this.selectedDepartmentId || undefined,
      sortBy: 'employeeCode',
      sortDirection: 'ASC',
      page: this.currentPage,
      size: this.pageSize,
    };
  }
}
