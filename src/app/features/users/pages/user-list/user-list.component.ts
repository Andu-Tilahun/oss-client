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
import {TabItem} from "../../../../shared/tabs/models/tab-item.model";
import {exportRowsToExcel} from "../../../../shared/utils/excel-export.util";

export type UsersTabKey = 'investor' | 'staff' | 'admin';

@Component({
  selector: 'app-user-list',
  standalone: false,
  templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit {
  usersActiveTab: UsersTabKey = 'investor';
  usersTabs: TabItem[] = [
    {key: 'investor', label: 'Investors'},
    {key: 'staff', label: 'Staff'},
    {key: 'admin', label: 'Admins'},
  ];

  /** "Staff" = any user that is neither Investor nor Admin — enforced server-side via excludeRoles. */
  readonly STAFF_EXCLUDED_ROLES = ['ADMIN', 'INVESTOR'];

  investorUsers: User[] = [];
  investorLoading = false;
  investorTotal = 0;
  investorPageSize = 10;
  investorPageIndex = 1;

  staffUsers: User[] = [];
  staffLoading = false;
  staffTotal = 0;
  staffPageSize = 10;
  staffPageIndex = 1;

  adminUsers: User[] = [];
  adminLoading = false;
  adminTotal = 0;
  adminPageSize = 10;
  adminPageIndex = 1;

  // Search
  searchText = '';

  genderFilters: FilterOption[] = [
    {label: 'Male', value: 'MALE', checked: false},
    {label: 'Female', value: 'FEMALE', checked: false},
  ];

  /** Role filter is only meaningful on the Staff tab (it spans more than one role); Investor/Admin tabs are already single-role. */
  staffRoleFilters: FilterOption[] = [
    {label: 'Operator', value: 'OPERATOR', checked: false},
    {label: 'Extension Worker', value: 'EXTENSION_WORKER', checked: false},
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

  /** Role options offered by the create-user form; set per-tab in onAdd(). */
  createAllowedRoleNames: string[] = ['INVESTOR'];

  columns: DataTableColumn<User>[] = [
    {
      header: 'Username',
      value: (user) => user.username,
      defaultVisible: false,
    },
    {
      header: 'Full Name',
      value: (user) => `${user.firstName} ${user.lastName}`,
      defaultVisible: true,
    },
    {
      header: 'Email',
      value: (user) => user.email,
      defaultVisible: true,
      hiddenBelowPx: 920,
    },
    {
      header: 'Gender',
      value: (user) => user.gender,
      defaultVisible: false,
    },
    {
      header: 'Role',
      value: (user) => user.role,
      defaultVisible: true,
    },
    {
      header: 'Status',
      value: (user) => user.accountNonLocked ? 'ACTIVE' : 'LOCKED',
      defaultVisible: false,
    },
    {
      header: 'Lock/Unlock',
      columnType: ColumnType.LINK,
      value: (user) => user.accountNonLocked ? 'Lock' : 'Unlock',
      columnAction: (user) => this.onToggleLock(user),
      defaultVisible: false,
    }
  ];

  /** Export should only include real data columns, not the Lock/Unlock action link. */
  get exportColumns(): DataTableColumn<User>[] {
    return this.columns.filter((c) => !c.columnAction);
  }

  constructor(private userService: UserService, private toastService: ToastService) {
  }

  ngOnInit() {
    this.loadActiveTab();
  }

  onUsersTabChange(key: string): void {
    this.usersActiveTab = key as UsersTabKey;
    this.loadActiveTab();
  }

  private loadActiveTab(previousId?: string | null): void {
    if (this.usersActiveTab === 'staff') {
      this.loadStaff(previousId);
    } else if (this.usersActiveTab === 'admin') {
      this.loadAdmins(previousId);
    } else {
      this.loadInvestors(previousId);
    }
  }

  loadInvestors(previousId?: string | null): void {
    this.investorLoading = true;
    const request = this.buildTabFilterRequest('investor', this.investorPageIndex - 1, this.investorPageSize);
    this.userService.filterUsers(request).subscribe({
      next: (response: PageResponse<User>) => {
        this.investorUsers = response.content;
        this.investorTotal = response.totalElements;
        this.investorLoading = false;
        if (this.usersActiveTab !== 'investor') return;
        this.selectFromList(this.investorUsers, previousId);
      },
      error: () => {
        this.investorLoading = false;
      }
    });
  }

  loadStaff(previousId?: string | null): void {
    this.staffLoading = true;
    const request = this.buildTabFilterRequest('staff', this.staffPageIndex - 1, this.staffPageSize);
    this.userService.filterUsers(request).subscribe({
      next: (response: PageResponse<User>) => {
        this.staffUsers = response.content;
        this.staffTotal = response.totalElements;
        this.staffLoading = false;
        if (this.usersActiveTab !== 'staff') return;
        this.selectFromList(this.staffUsers, previousId);
      },
      error: () => {
        this.staffLoading = false;
      }
    });
  }

  loadAdmins(previousId?: string | null): void {
    this.adminLoading = true;
    const request = this.buildTabFilterRequest('admin', this.adminPageIndex - 1, this.adminPageSize);
    this.userService.filterUsers(request).subscribe({
      next: (response: PageResponse<User>) => {
        this.adminUsers = response.content;
        this.adminTotal = response.totalElements;
        this.adminLoading = false;
        if (this.usersActiveTab !== 'admin') return;
        this.selectFromList(this.adminUsers, previousId);
      },
      error: () => {
        this.adminLoading = false;
      }
    });
  }

  /** Per-tab role scoping shared by the load*() methods and onExport(). */
  private buildTabFilterRequest(tab: UsersTabKey, page: number, size: number): FilterRequest {
    const base = this.buildFilterRequest(page, size);
    if (tab === 'investor') {
      return {...base, roles: ['INVESTOR']};
    }
    if (tab === 'admin') {
      return {...base, roles: ['ADMIN']};
    }
    // Staff: when the admin narrows by specific staff role(s), use an inclusion filter; otherwise
    // fall back to "everyone who isn't Admin/Investor" via the backend's exclusion filter.
    const selectedStaffRoles = this.getSelectedValues(this.staffRoleFilters);
    return {
      ...base,
      ...(selectedStaffRoles ? {roles: selectedStaffRoles} : {excludeRoles: this.STAFF_EXCLUDED_ROLES}),
    };
  }

  private selectFromList(list: User[], previousId?: string | null): void {
    if (list.length === 0) {
      this.selectedUser = null;
      return;
    }

    if (previousId) {
      const match = list.find((u) => u.id === previousId);
      if (match) {
        this.selectedUser = {...match};
        return;
      }
    }

    this.selectedUser = {...list[0]};
    this.detailRefreshKey++;
  }

  onInvestorPageChange(params: TableQueryParams): void {
    this.investorPageIndex = params.pageIndex;
    this.investorPageSize = params.pageSize;
    this.loadInvestors();
  }

  onStaffPageChange(params: TableQueryParams): void {
    this.staffPageIndex = params.pageIndex;
    this.staffPageSize = params.pageSize;
    this.loadStaff();
  }

  onAdminPageChange(params: TableQueryParams): void {
    this.adminPageIndex = params.pageIndex;
    this.adminPageSize = params.pageSize;
    this.loadAdmins();
  }

  onAdd(tab: UsersTabKey): void {
    this.createAllowedRoleNames = tab === 'investor'
      ? ['INVESTOR']
      : tab === 'admin'
        ? ['ADMIN']
        : ['OPERATOR', 'EXTENSION_WORKER'];
    this.showCreateModal = true;
  }

  onRefresh(): void {
    this.loadActiveTab();
  }

  onExport(): void {
    const tab = this.usersActiveTab;
    const total = tab === 'investor' ? this.investorTotal : tab === 'staff' ? this.staffTotal : this.adminTotal;
    const label = tab === 'investor' ? 'Investors' : tab === 'staff' ? 'Staff' : 'Admins';
    const request = this.buildTabFilterRequest(tab, 0, Math.max(total, 1));

    this.userService.filterUsers(request).subscribe({
      next: (response: PageResponse<User>) => {
        const rows = response.content;
        const {sizeBytes} = exportRowsToExcel(rows, this.exportColumns, `users-${tab}`);
        this.userService.notifyExport({
          exportLabel: label,
          recordCount: rows.length,
          fileSizeBytes: sizeBytes,
        }).subscribe({error: () => {}});
        this.toastService.success(`Exported ${rows.length} ${label.toLowerCase()}`);
      },
      error: () => this.toastService.error('Export failed'),
    });
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
        this.loadActiveTab();
      },
      error: () => {
        this.lockLoading = false;
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

        this.loadActiveTab();
      },
      error: () => {
        this.lockLoading = false;
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
        this.loadActiveTab();
      },
      error: () => {}
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
    this.loadActiveTab();
  }

  onUserUpdated() {
    this.loadActiveTab();
  }

  buildFilterRequest(page: number, size: number): Omit<FilterRequest, 'page' | 'size'> & { page: number; size: number } {
    return {
      searchText: this.searchText || undefined,
      genders: this.getSelectedValues(this.genderFilters),
      sortBy: this.sortBy,
      sortDirection: this.sortDirection,
      page,
      size
    };
  }

  getSelectedValues(filters: FilterOption[]): string[] | undefined {
    const selected = filters.filter(f => f.checked).map(f => f.value);
    return selected.length > 0 ? selected : undefined;
  }

  onSearch() {
    this.resetActiveTabPaging();
    this.loadActiveTab();
  }

  onFilterChange() {
    this.resetActiveTabPaging();
    this.loadActiveTab();
  }

  clearFilters() {
    this.resetActiveTabPaging();
    this.loadActiveTab();
  }

  private resetActiveTabPaging(): void {
    if (this.usersActiveTab === 'investor') this.investorPageIndex = 1;
    else if (this.usersActiveTab === 'staff') this.staffPageIndex = 1;
    else this.adminPageIndex = 1;
  }
}
