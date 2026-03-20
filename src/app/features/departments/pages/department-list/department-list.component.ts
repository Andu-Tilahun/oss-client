import { Component, OnInit } from '@angular/core';
import { DataTableColumn } from '../../../../shared/data-table/models/data-table-column.model';
import { TableQueryParams } from '../../../../shared/data-table/models/table-query-params.model';
import { Department } from '../../models/department.model';
import { DepartmentService } from '../../services/department.service';
import { ToastService } from '../../../../shared/toast/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-department-list',
  standalone: false,
  templateUrl: './department-list.component.html',
})
export class DepartmentListComponent implements OnInit {
  departments: Department[] = [];
  allFiltered: Department[] = [];
  displayedDepartments: Department[] = [];
  loading = false;
  searchText = '';
  total = 0;
  pageSize = 10;
  pageIndex = 1;

  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedDepartment: Department | null = null;

  columns: DataTableColumn<Department>[] = [
    { header: 'Name', value: (d) => d.name },
  ];

  constructor(
    private departmentService: DepartmentService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDepartments();
  }

  loadDepartments() {
    this.loading = true;
    this.departmentService.getAll().subscribe({
      next: (list) => {
        this.departments = list ?? [];
        this.applyFilter();
        this.loading = false;
        this.toastService.success('Departments retrieved successfully');
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.message || 'Failed to fetch departments', 'Fetch Departments');
      },
    });
  }

  private applyFilter() {
    const q = (this.searchText || '').toLowerCase().trim();
    this.allFiltered = q
      ? this.departments.filter((d) => d.name.toLowerCase().includes(q))
      : [...this.departments];
    this.total = this.allFiltered.length;
    this.updateDisplayedPage();
  }

  private updateDisplayedPage() {
    const start = (this.pageIndex - 1) * this.pageSize;
    this.displayedDepartments = this.allFiltered.slice(start, start + this.pageSize);
  }

  onPageChange(params: TableQueryParams) {
    this.pageIndex = params.pageIndex;
    this.pageSize = params.pageSize;
    this.updateDisplayedPage();
  }

  onAdd() {
    this.showCreateModal = true;
  }

  onRefresh() {
    this.loadDepartments();
  }

  onSearch() {
    this.applyFilter();
    this.pageIndex = 1;
  }

  clearFilters() {
    this.searchText = '';
    this.applyFilter();
    this.pageIndex = 1;
  }

  onEdit(d: Department) {
    this.selectedDepartment = d;
    this.showEditModal = true;
  }

  onView(d: Department) {
    this.router.navigate(['/inventory/departments', d.id]);
  }

  onDelete(d: Department) {
    this.selectedDepartment = d;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.selectedDepartment) return;
    this.departmentService.delete(this.selectedDepartment.id).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.selectedDepartment = null;
        this.loadDepartments();
      },
      error: (err) => {
        this.toastService.error(err.message || 'Failed to delete department', 'Delete Department');
      },
    });
  }

  onDepartmentCreated() {
    this.loadDepartments();
  }

  onDepartmentUpdated() {
    this.loadDepartments();
  }
}
