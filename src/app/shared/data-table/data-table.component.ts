import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output
} from '@angular/core';
import {DataTableColumn} from './models/data-table-column.model';
import {ColumnType} from './models/column-types.model';
import {TableQueryParams} from './models/table-query-params.model';

const DEFAULT_PAGE_SIZE = 10;

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent<T> {
  private _columns: DataTableColumn<T>[] = [];
  @Input()
  set columns(value: DataTableColumn<T>[]) {
    this._columns = value ?? [];
    // Default: all columns visible when columns input changes.
    this.columnVisibility = this._columns.map(() => true);
  }
  get columns(): DataTableColumn<T>[] {
    return this._columns;
  }

  @Input() data: T[] = [];
  @Input() loading = false;
  @Input() total = 0;
  @Input() pageSize = DEFAULT_PAGE_SIZE;
  @Input() pageIndex = 1;
  @Input() showPagination = true;
  @Input() showIndex = false;
  @Input() showActionColumn = true;
  @Input() noDataMessage = 'No data available';

  /** If true, clicking a row emits `rowClick` */
  @Input() rowClickable = false;

  // Action header buttons visibility
  @Input() showAddButton = false;
  @Input() showRefreshButton = false;
  @Input() showExportButton = false;

  // Action buttons visibility
  @Input() showViewButton = false;
  @Input() showEditButton = false;
  @Input() showDeleteButton = false;

  // Icons (we'll use SVG paths)
  @Input() viewIcon = 'eye';
  @Input() editIcon = 'edit';
  @Input() deleteIcon = 'delete';

  @Input() addButtonText = 'Add';
  @Input() refreshButtonText = 'Refresh';
  @Input() exportButtonText = 'Export';

  @Output() pageChange = new EventEmitter<TableQueryParams>();
  @Output() viewClick = new EventEmitter<T>();
  @Output() editClick = new EventEmitter<T>();
  @Output() deleteClick = new EventEmitter<T>();
  @Output() addClick = new EventEmitter<void>();
  @Output() refreshClick = new EventEmitter<void>();
  @Output() exportClick = new EventEmitter<void>();
  @Output() rowClick = new EventEmitter<T>();

  columnType = ColumnType;

  // Column visibility
  columnVisibility: boolean[] = [];
  showColumnPicker = false;
  @Input() showColumnPickerControl = true;

  // Pagination
  pageSizeOptions = [10, 20, 50, 100];

  constructor(private readonly elRef: ElementRef<HTMLElement>) {}

  get visibleColumns(): DataTableColumn<T>[] {
    return this._columns.filter((_, idx) => this.columnVisibility[idx] !== false);
  }

  toggleColumnPicker(event?: MouseEvent): void {
    event?.stopPropagation();
    this.showColumnPicker = !this.showColumnPicker;
  }

  setColumnVisible(index: number, visible: boolean): void {
    this.columnVisibility[index] = visible;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showColumnPicker) return;
    const target = event.target as Node | null;
    if (target && this.elRef.nativeElement.contains(target)) return;
    this.showColumnPicker = false;
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
  }

  get startIndex(): number {
    return (this.pageIndex - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.pageIndex * this.pageSize, this.total);
  }

  get paginatedData(): T[] {
    return this.data;
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.pageIndex - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.pageIndex) {
      this.pageIndex = page;
      this.emitPageChange();
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize = Number(target.value);
    this.pageIndex = 1;
    this.emitPageChange();
  }

  private emitPageChange(): void {
    this.pageChange.emit({
      pageIndex: this.pageIndex,
      pageSize: this.pageSize
    });
  }

  trackByIndex(index: number): number {
    return index;
  }

  handleRowClick(item: T, event: MouseEvent): void {
    if (!this.rowClickable) return;

    const target = event.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase() ?? '';
    // Avoid triggering on interactive elements inside the row
    if (tag === 'button' || tag === 'a' || tag === 'input' || target?.closest('button,a,input')) {
      return;
    }
    this.rowClick.emit(item);
  }
}
