import { Component, OnInit } from '@angular/core';
import { DataTableColumn } from '../../../../shared/data-table/models/data-table-column.model';
import { TableQueryParams } from '../../../../shared/data-table/models/table-query-params.model';
import {
  Item,
  ItemFilterRequest,
  ItemStatus,
  ItemCondition,
} from '../../models/item.model';
import { ItemType } from '../../../item-types/models/item-type.model';
import { ItemService } from '../../services/item.service';
import { ItemTypeService } from '../../../item-types/services/item-type.service';
import { ToastService } from '../../../../shared/toast/toast.service';
import { PageResponse } from '../../../../shared/models/api-response.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-item-list',
  standalone: false,
  templateUrl: './item-list.component.html',
})
export class ItemListComponent implements OnInit {
  items: Item[] = [];
  itemTypes: ItemType[] = [];
  loading = false;
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  currentPage = 0;

  searchText = '';
  selectedItemTypeId = '';
  selectedStatuses: ItemStatus[] = [];
  selectedConditions: ItemCondition[] = [];

  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedItem: Item | null = null;

  columns: DataTableColumn<Item>[] = [
    { header: 'Serial Number', value: (i) => i.serialNumber },
    { header: 'Name', value: (i) => i.name ?? '-' },
    { header: 'Type', value: (i) => i.itemTypeName ?? '-' },
    { header: 'Condition', value: (i) => i.condition },
    { header: 'Status', value: (i) => i.status },
  ];

  constructor(
    private itemService: ItemService,
    private itemTypeService: ItemTypeService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadItemTypes();
    this.loadItems();
  }

  loadItemTypes() {
    this.itemTypeService.getAll().subscribe({
      next: (list: ItemType[]) => (this.itemTypes = list ?? []),
    });
  }

  loadItems() {
    this.loading = true;
    const request: ItemFilterRequest = {
      searchText: this.searchText || undefined,
      itemTypeId: this.selectedItemTypeId || undefined,
      statuses: this.selectedStatuses.length ? this.selectedStatuses : undefined,
      conditions: this.selectedConditions.length ? this.selectedConditions : undefined,
      sortBy: 'serialNumber',
      sortDirection: 'ASC',
      page: this.currentPage,
      size: this.pageSize,
    };
    this.itemService.filter(request).subscribe({
      next: (res: PageResponse<Item>) => {
        this.items = res?.content ?? [];
        this.total = res?.totalElements ?? 0;
        this.loading = false;
        this.toastService.success('Items retrieved successfully');
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.message || 'Failed to fetch items', 'Fetch Items');
      },
    });
  }

  onPageChange(params: TableQueryParams) {
    this.pageIndex = params.pageIndex;
    this.currentPage = this.pageIndex - 1;
    this.pageSize = params.pageSize;
    this.loadItems();
  }

  onAdd() {
    this.showCreateModal = true;
  }

  onRefresh() {
    this.loadItems();
  }

  onSearch() {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadItems();
  }

  onFilterChange() {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadItems();
  }

  clearFilters() {
    this.searchText = '';
    this.selectedItemTypeId = '';
    this.selectedStatuses = [];
    this.selectedConditions = [];
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadItems();
  }

  onEdit(i: Item) {
    this.selectedItem = i;
    this.showEditModal = true;
  }

  onView(i: Item) {
    this.router.navigate(['/inventory/items', i.id]);
  }

  onDelete(i: Item) {
    this.selectedItem = i;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.selectedItem) return;
    // Backend doesn't have delete for items - we could add it or skip. For now skip delete.
    this.toastService.error('Delete item not implemented', 'Delete Item');
    this.showDeleteModal = false;
    this.selectedItem = null;
  }

  onItemCreated() {
    this.loadItems();
  }

  onItemUpdated() {
    this.loadItems();
  }
}
