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
  TemplateRef,
  ViewChild
} from '@angular/core';
import {DataTableColumn} from './models/data-table-column.model';
import {ColumnType} from './models/column-types.model';
import {TableQueryParams} from './models/table-query-params.model';
import {PageSplitRightAction} from '../components/page-split-layout/page-split-layout/page-split-right-action.model';

const DEFAULT_PAGE_SIZE = 10;
/** Matches Tailwind's `lg` breakpoint, and `app-page-split-layout`'s own stacking breakpoint. */
const LG_BREAKPOINT_PX = 1024;

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

  /** Id of the row currently shown in a right-hand detail panel — that row gets a highlighted
   *  background so it's clear which record's detail is on screen. */
  @Input() selectedRowId: string | number | null = null;

  /** How to read an id off a row item, for matching against `selectedRowId`. Defaults to `.id`. */
  @Input() rowIdField: (item: T) => string | number | null | undefined = (item: any) => item?.id;

  /** Optional override for the empty-state body; falls back to the default icon + noDataMessage when not provided. */
  @ContentChild('emptyState') emptyStateTemplate: TemplateRef<any> | null = null;

  /** If true, clicking a row emits `rowClick` */
  @Input() rowClickable = false;

  /**
   * Optional per-row detail content, rendered inline in an expanded row when a row is tapped —
   * but only below the `lg` breakpoint (on desktop, consumers show detail in `app-page-split-layout`'s
   * side panel instead; pass the *same* `TemplateRef` to both to avoid maintaining two copies).
   * Context: `{ $implicit: item }`, matching `page-split-layout`'s `#rightContent`.
   */
  @Input() rowDetailTemplate: TemplateRef<any> | null = null;

  /**
   * Optional override for the mobile/tablet card grid's title field — defaults to the first
   * column that isn't IMAGE/BUTTON/CHECK_BOX. Only needed when that default picks the wrong
   * column for a given table.
   */
  @Input() cardTitleField?: (item: T) => string;

  /** Id of the row currently expanded inline (mobile/tablet only). */
  expandedRowId: string | number | null = null;

  /** Below `lg`, row taps expand inline detail instead of relying on a side panel. */
  protected isMobile = false;

  /**
   * Visible width of the table's horizontal-scroll container, in px — a colspan cell in an
   * auto-layout table sizes to the table's *total* column width, not the viewport, so the inline
   * detail content is explicitly pinned to this instead (see template). `null` until measured.
   */
  protected detailPanelWidthPx: number | null = null;

  @ViewChild('tableScroller') private tableScroller?: ElementRef<HTMLElement>;

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
  ) {
    this.updateIsMobile();
  }

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
    const wasMobile = this.isMobile;
    this.updateIsMobile();
    if (wasMobile && !this.isMobile) {
      // Crossing up past `lg`: the side panel takes over, so don't leave a row expanded inline.
      this.expandedRowId = null;
    }
    this.measureDetailPanelWidth();
    this.cdr.markForCheck();
  }

  private updateIsMobile(): void {
    this.isMobile = typeof window !== 'undefined' ? window.innerWidth < LG_BREAKPOINT_PX : false;
  }

  /** Visible (non-scrolled) width of the table's own horizontal-scroll container. */
  private measureDetailPanelWidth(): void {
    this.detailPanelWidthPx = this.tableScroller?.nativeElement?.clientWidth || null;
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

  isRowSelected(item: T): boolean {
    return this.selectedRowId != null && this.rowIdField(item) === this.selectedRowId;
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

    if (this.rowDetailTemplate && this.isMobile) {
      const id = this.rowIdField(item) ?? null;
      this.expandedRowId = this.expandedRowId === id ? null : id;
      if (this.expandedRowId != null) {
        this.measureDetailPanelWidth();
        // The table may already be scrolled horizontally (e.g. the user scrolled to read a
        // truncated column) — reset so the newly-expanded detail isn't clipped by that offset.
        const scroller = this.tableScroller?.nativeElement;
        if (scroller) {
          scroller.scrollLeft = 0;
        }
      }
    }
  }

  isRowExpanded(item: T): boolean {
    const id = this.rowIdField(item) ?? null;
    return id != null && this.expandedRowId === id;
  }

  // ---- Mobile/tablet gallery card grid ----------------------------------------------------

  /** Even `order` slots reserve each card's own place; detailOrder() interleaves into the
   *  single odd slot that always falls in a fresh row right after a given pair of cards —
   *  CSS Grid auto-placement follows order-modified document order, same as flexbox. */
  cardOrder(i: number): number {
    return i * 2;
  }

  detailOrder(i: number): number {
    const pairIndex = Math.floor(i / 2);
    return pairIndex * 4 + 3;
  }

  private get autoImageColumn(): DataTableColumn<T> | undefined {
    return this._columns.find((c) => c.columnType === ColumnType.IMAGE);
  }

  private get autoTitleColumn(): DataTableColumn<T> | undefined {
    return this._columns.find(
      (c) =>
        c.columnType !== ColumnType.IMAGE &&
        c.columnType !== ColumnType.BUTTON &&
        c.columnType !== ColumnType.CHECK_BOX
    );
  }

  cardImageUrl(item: T): string | null {
    const col = this.autoImageColumn;
    const url = col?.value?.(item);
    return url ? String(url) : null;
  }

  cardMediaKind(item: T): 'image' | 'video' {
    const col = this.autoImageColumn;
    return col?.mediaKind?.(item) === 'video' ? 'video' : 'image';
  }

  cardImageAlt(item: T): string {
    return this.autoImageColumn?.imageAlt?.(item) ?? '';
  }

  cardTitle(item: T): string {
    if (this.cardTitleField) return this.cardTitleField(item);
    const col = this.autoTitleColumn;
    return col?.value ? String(col.value(item) ?? '') : '';
  }

  /** Up to 3 more fields (beyond the title) to surface on the card, in column order. */
  cardSecondaryFields(item: T): { header: string; value: string }[] {
    const titleCol = this.autoTitleColumn;
    const imageCol = this.autoImageColumn;
    const fields: { header: string; value: string }[] = [];
    for (const col of this.visibleColumns) {
      if (fields.length >= 3) break;
      if (col === titleCol || col === imageCol) continue;
      if (col.columnType === ColumnType.CHECK_BOX || col.columnType === ColumnType.IMAGE) continue;
      const raw = col.value ? col.value(item) : '';
      if (raw === null || raw === undefined || raw === '') continue;
      fields.push({ header: col.header, value: String(raw) });
    }
    return fields;
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

  cardDownloadAction(item: T): PageSplitRightAction<T> | null {
    return this.rowActions.find((a) => a.icon === 'download' && this.isRowActionVisible(a, item)) ?? null;
  }
}
