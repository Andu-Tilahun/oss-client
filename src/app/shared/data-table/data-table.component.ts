import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  TemplateRef
} from '@angular/core';
import {DataTableColumn} from './models/data-table-column.model';
import {ColumnType} from './models/column-types.model';
import {TableQueryParams} from './models/table-query-params.model';
import {PageSplitRightAction} from '../components/page-split-layout/page-split-layout/page-split-right-action.model';

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
    this.columnUserOverrides = this._columns.map(() => null);
    this.applyColumnVisibility();
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

  /** Optional override for the empty-state body; falls back to the default icon + noDataMessage when not provided. */
  @ContentChild('emptyState') emptyStateTemplate: TemplateRef<any> | null = null;

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
  @Input() rowActions: PageSplitRightAction<T>[] = [];
  @Input() actionCellLabel?: (item: T) => string;

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
  private columnUserOverrides: (boolean | null)[] = [];
  showColumnPicker = false;
  @Input() showColumnPickerControl = true;

  // Pagination
  pageSizeOptions = [10, 20, 50, 100];

  constructor(
    private readonly elRef: ElementRef<HTMLElement>,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get visibleColumns(): DataTableColumn<T>[] {
    return this._columns.filter((_, idx) => this.columnVisibility[idx] !== false);
  }

  toggleColumnPicker(event?: MouseEvent): void {
    event?.stopPropagation();
    this.showColumnPicker = !this.showColumnPicker;
  }

  setColumnVisible(index: number, visible: boolean): void {
    this.columnUserOverrides[index] = visible;
    this.columnVisibility[index] = visible;
    this.cdr.markForCheck();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.applyColumnVisibility();
    this.cdr.markForCheck();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showColumnPicker) return;
    const target = event.target as Node | null;
    if (target && this.elRef.nativeElement.contains(target)) return;
    this.showColumnPicker = false;
  }

  private applyColumnVisibility(): void {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    this.columnVisibility = this._columns.map((column, index) => {
      const userOverride = this.columnUserOverrides[index];
      if (userOverride !== null && userOverride !== undefined) {
        return userOverride;
      }

      let visible = column.defaultVisible ?? true;
      if (column.hiddenBelowPx != null && viewportWidth < column.hiddenBelowPx) {
        visible = false;
      }
      return visible;
    });
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

  resolveCellClass(column: DataTableColumn<T>, item: T): string {
    const cls = column.cellClass;
    return typeof cls === 'function' ? (cls(item) ?? '') : (cls ?? '');
  }

  resolveCheckboxChecked(column: DataTableColumn<T>, item: T): boolean {
    const val = column.defaultValue;
    return typeof val === 'function' ? !!val(item) : !!val;
  }

  resolveCheckboxDisabled(column: DataTableColumn<T>, item: T): boolean {
    const val = column.disabled;
    return typeof val === 'function' ? !!val(item) : !!val;
  }

  isRowActionVisible(action: PageSplitRightAction<T>, item: T): boolean {
    if (!action.visible) {
      return true;
    }
    return action.visible(item);
  }

  isRowActionDisabled(action: PageSplitRightAction<T>, item: T): boolean {
    if (!action.disabled) {
      return false;
    }
    return action.disabled(item);
  }

  onRowActionClick(action: PageSplitRightAction<T>, item: T): void {
    if (this.isRowActionDisabled(action, item)) {
      return;
    }
    action.action(item);
  }
}
