import {Component, OnInit} from '@angular/core';
import {UserService} from '../../services/user.service';
import {TableQueryParams} from "../../../../shared/data-table/models/table-query-params.model";
import {DataTableColumn} from "../../../../shared/data-table/models/data-table-column.model";
import {ColumnType} from "../../../../shared/data-table/models/column-types.model";
import {PageResponse} from "../../../../shared/models/api-response.model";
import {User} from "../../models/user.model";
import {ToastService} from "../../../../shared/toast/toast.service";
import {FilterOption} from "../../../../shared/models/filter.model";
import {FilterRequest} from "../user-filter/filter-request";

@Component({
  selector: 'app-user-list',
  standalone: false,
  templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = false;
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  currentPage = 0;
  // Search
  searchText = '';

  roleFilters: FilterOption[] = [
    {label: 'Admin', value: 'ADMIN', checked: false},
    {label: 'Operator', value: 'OPERATOR', checked: false},
    {label: 'Employee', value: 'EMPLOYEE', checked: false},
    {label: 'CCA', value: 'CCA', checked: false},
    {label: 'Investor', value: 'INVESTOR', checked: false},
  ];

  genderFilters: FilterOption[] = [
    {label: 'Male', value: 'MALE', checked: false},
    {label: 'Female', value: 'FEMALE', checked: false},
    {label: 'Other', value: 'OTHER', checked: false}
  ];


  statusFilters: FilterOption[] = [
    {label: 'Active', value: 'ACTIVE', checked: false},
    {label: 'Inactive', value: 'INACTIVE', checked: false}
  ];

  // Sorting
  sortBy = 'id';
  sortDirection: 'ASC' | 'DESC' = 'DESC';

  showCreateModal = false;
  showEditModal = false;
  showLockModal = false;
  showUnlockModal = false;
  lockLoading = false;
  showDeleteModal = false;
  selectedUser: User | null = null;
  // Forces the right-side detail component to re-render after list mutations.
  detailRefreshKey = 0;

  columns: DataTableColumn<User>[] = [
    {
      header: 'Username',
      value: (user) => user.username
    },
    {
      header: 'Full Name',
      value: (user) => `${user.firstName} ${user.lastName}`
    },
    {
      header: 'Email',
      value: (user) => user.email
    },
    {
      header: 'Gender',
      value: (user) => user.gender
    },
    {
      header: 'Role',
      value: (user) => user.role
    },
    {
      header: 'Status',
      value: (user) => user.accountNonLocked ? 'ACTIVE' : 'LOCKED'
    },
    {
      header: 'Lock/Unlock',
      columnType: ColumnType.LINK,
      value: (user) => user.accountNonLocked ? 'Lock' : 'Unlock',
      columnAction: (user) => this.onToggleLock(user)
    }
  ];

  constructor(private userService: UserService, private toastService: ToastService) {
  }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    const filterRequest: FilterRequest = this.buildFilterRequest();
    const previousSelectedId = this.selectedUser?.id;
    this.userService.filterUsers(filterRequest).subscribe({
      next: (response: PageResponse<User>) => {
        this.users = response.content;
        this.total = response.totalElements;
        this.loading = false;
        this.toastService.success(`Users retrieved successfully`);

        // Default selection (mirrors the farm-plot behavior)
        // 1) If the list is empty => no selection
        // 2) If nothing was selected => select first row
        // 3) If something was selected => keep it if it still exists
        if (this.users.length === 0) {
          this.selectedUser = null;
          return;
        }

        if (!previousSelectedId) {
          this.selectedUser = {...this.users[0]};
          this.detailRefreshKey++;
          return;
        }

        const match = this.users.find((u) => u.id === previousSelectedId);
        if (match) {
          this.selectedUser = {...match};
          return;
        }

        this.selectedUser = {...this.users[0]};
        this.detailRefreshKey++;
      },
      error: (error) => {
        this.toastService.error(
          error.message || 'Failed to fetch users',
          'Fetch Users'
        );
        this.loading = false;
      }
    });
  }

  onPageChange(params: TableQueryParams) {
    this.pageIndex = params.pageIndex;
    this.currentPage = this.pageIndex - 1;
    this.pageSize = params.pageSize;
    this.loadUsers();
  }

  onAdd() {
    this.showCreateModal = true;
  }

  onRefresh() {
    this.loadUsers();
  }

  onExport() {
    console.log('Export users');
    // Implement export functionality
  }

  onView(user: User) {
    // For the split view: select the row for the right pane.
    this.selectedUser = {...user};
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showLockModal = false;
    this.showUnlockModal = false;
  }

  onEdit(user: User) {
    this.selectedUser = {...user};
    this.showCreateModal = false;
    this.showDeleteModal = false;
    this.showLockModal = false;
    this.showUnlockModal = false;
    this.showEditModal = true;
  }

  // Lock/Unlock Actions
  onToggleLock(user: User) {
    this.selectedUser = {...user};
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;

    if (user.accountNonLocked) {
      // User is unlocked, show lock confirmation
      this.showLockModal = true;
      this.showUnlockModal = false;
    } else {
      // User is locked, show unlock confirmation
      this.showUnlockModal = true;
      this.showLockModal = false;
    }
  }

  handleLockUser() {
    if (!this.selectedUser) return;

    this.lockLoading = true;

    this.userService.lockUser(this.selectedUser.id).subscribe({
      next: () => {
        this.lockLoading = false;
        this.showLockModal = false;
        this.selectedUser = null;
        this.showEditModal = false;
        this.showDeleteModal = false;
        this.toastService.success(`User locked successfully`);
        this.loadUsers();
      },
      error: (error) => {
        this.lockLoading = false;
        this.toastService.error(
          error.message || 'Failed to lock user',
          'Lock User'
        );
      }
    });
  }

  handleUnlockUser() {
    if (!this.selectedUser) return;

    this.lockLoading = true;

    this.userService.unlockUser(this.selectedUser.id).subscribe({
      next: () => {
        this.lockLoading = false;
        this.showUnlockModal = false;
        this.selectedUser = null;
        this.showEditModal = false;
        this.showDeleteModal = false;
        this.toastService.success(`User unlocked successfully`);

        this.loadUsers();
      },
      error: (error) => {
        this.lockLoading = false;
        this.toastService.error(
          error.message || 'Failed to unlock user',
          'Unlock User'
        );
      }
    });
  }

  onDelete(user: User) {
    this.selectedUser = {...user};
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showLockModal = false;
    this.showUnlockModal = false;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.selectedUser) return;

    this.userService.deleteUser(this.selectedUser.id).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.selectedUser = null;
        this.toastService.success(`User deleted successfully`);
        this.loadUsers();
      },
      error: (error) => {
        this.toastService.error(
          error.message || 'Failed to delete user',
          'Delete User'
        );
      }
    });
  }

  onCloseDetail(): void {
    this.selectedUser = null;
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showLockModal = false;
    this.showUnlockModal = false;
  }

  onUserCreated() {
    this.loadUsers();
  }

  onUserUpdated() {
    this.loadUsers();
  }


  buildFilterRequest(): FilterRequest {
    return {
      searchText: this.searchText || undefined,
      roles: this.getSelectedValues(this.roleFilters),
      genders: this.getSelectedValues(this.genderFilters),
      sortBy: this.sortBy,
      sortDirection: this.sortDirection,
      page: this.currentPage,
      size: this.pageSize
    };
  }

  getSelectedValues(filters: FilterOption[]): string[] | undefined {
    const selected = filters.filter(f => f.checked).map(f => f.value);
    return selected.length > 0 ? selected : undefined;
  }

  onSearch() {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadUsers();
  }

  onFilterChange() {
    this.currentPage = 0;
    this.loadUsers();
  }

  clearFilters() {
    this.currentPage = 0;
    this.loadUsers();
  }


}
