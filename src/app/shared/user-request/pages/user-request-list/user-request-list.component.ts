import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {SharedModule} from '../../../shared.module';
import {DataTableColumn} from '../../../data-table/models/data-table-column.model';
import {TableQueryParams} from '../../../data-table/models/table-query-params.model';
import {UserRequest} from '../../models/user-request.model';
import {UserRequestService} from '../../services/user-request.service';
import {UserRequestFilterComponent} from '../user-request-filter/user-request-filter.component';

@Component({
  selector: 'app-user-request-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, UserRequestFilterComponent],
  templateUrl: './user-request-list.component.html',
})
export class UserRequestListComponent implements OnChanges {
  /** List of request types to fetch and show. Data is filtered by these types. */
  @Input() requestTypes: string[] = [];
  @Input() statusOptions: string[] = [];

  @Output() selected = new EventEmitter<UserRequest>();

  loading = false;
  pageSize = 10;
  pageIndex = 1;

  searchText = '';
  selectedStatus = '';
  /** User-selected request types for filtering. Empty = show all from requestTypes. */
  selectedRequestTypes: string[] = [];
  allRequests: UserRequest[] = [];

  columns: DataTableColumn<UserRequest>[] = [
    {header: 'Application No', value: (r) => r.applicationNumber},
    {header: 'Status', value: (r) => r.status},
    {header: 'User Request Type', value: (r) => r.requestType},
    {header: 'Created By', value: (r) => r.createdBy ?? ''},
    {header: 'Created Date', value: (r) => r.createdDate ? new Date(r.createdDate).toLocaleString() : ''},
  ];

  constructor(private userRequestService: UserRequestService) {}

  get filteredRequests(): UserRequest[] {
    let list = this.allRequests;
    if (this.selectedRequestTypes.length > 0) {
      list = list.filter((r) => this.selectedRequestTypes.includes(r.requestType));
    }
    if (this.searchText?.trim()) {
      const q = this.searchText.trim().toLowerCase();
      list = list.filter(
        (r) =>
          (r.applicationNumber?.toLowerCase().includes(q)) ||
          (r.requestType?.toLowerCase().includes(q)) ||
          (r.status?.toLowerCase().includes(q)) ||
          (r.createdBy?.toLowerCase().includes(q))
      );
    }
    return list;
  }

  get paginatedRequests(): UserRequest[] {
    const list = this.filteredRequests;
    const start = (this.pageIndex - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['requestTypes']) {
      this.selectedRequestTypes = [];
      this.load();
    }
  }

  load(): void {
    if (!this.requestTypes?.length) return;

    this.loading = true;
    const typesToQuery =
      this.selectedRequestTypes.length > 0 ? this.selectedRequestTypes : this.requestTypes;

    this.userRequestService
      .getByTypes(
        typesToQuery,
        this.selectedStatus || undefined,
        this.searchText || undefined
      )
      .subscribe({
      next: (data) => {
        this.allRequests = data ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.pageIndex = 1;
    this.load();
  }

  onSearch(): void {
    this.pageIndex = 1;
    this.load();
  }

  onClearFilters(): void {
    this.searchText = '';
    this.selectedRequestTypes = [];
    this.selectedStatus = '';
    this.pageIndex = 1;
    this.load();
  }

  onPageChange(params: TableQueryParams): void {
    this.pageIndex = params.pageIndex;
    this.pageSize = params.pageSize;
  }

  onRefresh(): void {
    this.load();
  }

  onDownload(): void {
    const rows = this.filteredRequests;
    if (rows.length === 0) return;
    const headers = ['Application No', 'Status', 'User Request Type', 'Created By', 'Created Date'];
    const csvRows = [
      headers.join(','),
      ...rows.map((r) =>
        [
          r.applicationNumber,
          r.status,
          r.requestType,
          r.createdBy ?? '',
          r.createdDate ? new Date(r.createdDate).toLocaleString() : '',
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  onRowClick(item: UserRequest): void {
    this.selected.emit(item);
  }
}

