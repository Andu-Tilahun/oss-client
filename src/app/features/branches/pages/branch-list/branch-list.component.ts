import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {Branch} from '../../models/branch.model';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {BranchService} from '../../services/branch.service';
import {TableQueryParams} from '../../../../shared/data-table/models/table-query-params.model';
import {PageResponse} from '../../../../shared/models/api-response.model';
import {ToastService} from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-branch-list',
  standalone: false,
  templateUrl: './branch-list.component.html',
  styleUrl: './branch-list.component.css'
})
export class BranchListComponent {
  branches: Branch[] = [];
  loading = false;
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  currentPage = 0;

  searchText = '';

  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedBranch: Branch | null = null;

  columns: DataTableColumn<Branch>[] = [
    {header: 'Name', value: (b) => b.branchName},
    {header: 'Main Branch', value: (b) => b.isMainBranch ? 'Yes' : 'No'}
  ];

  constructor(
    private branchService: BranchService,
    private toastService: ToastService,
    private router: Router
  ) {}

  onView(branch: Branch): void {
    this.router.navigate(['/branches', branch.id]);
  }

  ngOnInit() {
    this.loadBranches();
  }

  loadBranches() {
    this.loading = true;
    this.branchService.getAllBranches(this.currentPage, this.pageSize).subscribe({
      next: (response: PageResponse<Branch>) => {
        if (response) {
          this.branches = response.content;
          this.total = response.totalElements;
          this.loading = false;
          this.toastService.success(`Branches retrieved successfully`);
        }
      },
      error: (error) => {
        this.toastService.error(
          error.message || 'Failed to fetch branches',
          'Fetch Branches'
        );
        this.loading = false;
      }
    });
  }

  onPageChange(params: TableQueryParams) {
    this.pageIndex = params.pageIndex;
    this.currentPage = this.pageIndex - 1;
    this.pageSize = params.pageSize;
    this.loadBranches();
  }

  onAdd() {
    // this.selectedBranch = null;
    this.showCreateModal = true;
  }

  onRefresh() {
    this.loadBranches();
  }

  onSearch() {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadBranches();
  }

  clearFilters() {
    this.searchText = '';
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadBranches();
  }

  onEdit(branch: Branch) {
    this.selectedBranch = branch;
    this.showEditModal = true;
  }

  onDelete(branch: Branch) {
    this.selectedBranch = branch;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.selectedBranch) return;

    this.branchService.deleteBranch(this.selectedBranch.id).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.selectedBranch = null;
        this.loadBranches();
      },
      error: (error) => {
        this.toastService.error(
          error.message || 'Failed to delete branch',
          'Delete Branch'
        );
      }
    });
  }

  onBranchCreated() {
    this.showCreateModal = false;
    this.loadBranches();
  }

  onBranchUpdated() {
    this.showEditModal = false;
    this.loadBranches();
  }
}

