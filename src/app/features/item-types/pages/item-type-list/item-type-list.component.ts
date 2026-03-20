import { Component, OnInit } from '@angular/core';
import { DataTableColumn } from '../../../../shared/data-table/models/data-table-column.model';
import { TableQueryParams } from '../../../../shared/data-table/models/table-query-params.model';
import { ItemType } from '../../models/item-type.model';
import { ItemTypeService } from '../../services/item-type.service';
import { ToastService } from '../../../../shared/toast/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-item-type-list',
  standalone: false,
  templateUrl: './item-type-list.component.html',
})
export class ItemTypeListComponent implements OnInit {
  itemTypes: ItemType[] = [];
  allFiltered: ItemType[] = [];
  displayedItems: ItemType[] = [];
  loading = false;
  searchText = '';
  total = 0;
  pageSize = 10;
  pageIndex = 1;

  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedItemType: ItemType | null = null;

  columns: DataTableColumn<ItemType>[] = [
    { header: 'Name', value: (it) => it.name },
    { header: 'Category', value: (it) => it.category || '-' },
    { header: 'Gate Tracked', value: (it) => (it.gateTracked ? 'Yes' : 'No') },
  ];

  constructor(
    private itemTypeService: ItemTypeService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadItemTypes();
  }

  loadItemTypes() {
    this.loading = true;
    this.itemTypeService.getAll().subscribe({
      next: (list) => {
        this.itemTypes = list ?? [];
        this.applyFilter();
        this.loading = false;
        this.toastService.success('Item types retrieved successfully');
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.message || 'Failed to fetch item types', 'Fetch Item Types');
      },
    });
  }

  private applyFilter() {
    const q = (this.searchText || '').toLowerCase().trim();
    this.allFiltered = q
      ? this.itemTypes.filter(
          (it) =>
            it.name.toLowerCase().includes(q) ||
            (it.category && it.category.toLowerCase().includes(q))
        )
      : [...this.itemTypes];
    this.total = this.allFiltered.length;
    this.updateDisplayedPage();
  }

  private updateDisplayedPage() {
    const start = (this.pageIndex - 1) * this.pageSize;
    this.displayedItems = this.allFiltered.slice(start, start + this.pageSize);
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
    this.loadItemTypes();
  }

  onSearch() {
    this.pageIndex = 1;
    this.applyFilter();
  }

  clearFilters() {
    this.searchText = '';
    this.pageIndex = 1;
    this.applyFilter();
  }

  onEdit(it: ItemType) {
    this.selectedItemType = it;
    this.showEditModal = true;
  }

  onView(it: ItemType) {
    this.router.navigate(['/inventory/item-types', it.id]);
  }

  onDelete(it: ItemType) {
    this.selectedItemType = it;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.selectedItemType) return;
    this.itemTypeService.delete(this.selectedItemType.id).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.selectedItemType = null;
        this.loadItemTypes();
      },
      error: (err) => {
        this.toastService.error(err.message || 'Failed to delete item type', 'Delete Item Type');
      },
    });
  }

  onItemTypeCreated() {
    this.loadItemTypes();
  }

  onItemTypeUpdated() {
    this.loadItemTypes();
  }
}
