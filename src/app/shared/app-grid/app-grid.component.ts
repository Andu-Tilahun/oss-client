import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import {AppGridConfig} from "./app-grid-config.model";
import {TableQueryParams} from "../data-table/models/table-query-params.model";
import {ColumnType} from "../data-table/models/column-types.model";
import {DataTableColumn} from "../data-table/models/data-table-column.model";


const DEFAULT_PAGE_SIZE = 10;

@Component({
  selector: 'app-grid',
  templateUrl: './app-grid.component.html',
  styleUrls: ['./app-grid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppGridComponent<TParent, TChild> implements OnChanges {
  // ── Data ────────────────────────────────────────────────────────────────
  @Input() data: TParent[] = [];
  @Input() loading = false;
  @Input() total = 0;

  // ── Grid Config ─────────────────────────────────────────────────────────
  @Input() config!: AppGridConfig<TParent, TChild>;

  // ── Display Options ─────────────────────────────────────────────────────
  @Input() showIndex = false;
  @Input() showActionColumn = true;
  @Input() showViewButton = false;
  @Input() showEditButton = false;
  @Input() showDeleteButton = false;
  @Input() noDataMessage = 'No data available';
  @Input() noChildDataMessage = 'No child records found';

  // ── Toolbar ─────────────────────────────────────────────────────────────
  @Input() showAddButton = false;
  @Input() showRefreshButton = false;
  @Input() showExportButton = false;
  @Input() showColumnPickerControl = true;

  // ── Pagination ───────────────────────────────────────────────────────────
  @Input() showPagination = true;
  @Input() pageSize = DEFAULT_PAGE_SIZE;
  @Input() pageIndex = 1;
  pageSizeOptions = [10, 20, 50, 100];

  // ── Child pagination ─────────────────────────────────────────────────────
  @Input() childPageSize = 5;
  childPageSizeOptions = [5, 10, 20];

  // ── Outputs ──────────────────────────────────────────────────────────────
  @Output() pageChange = new EventEmitter<TableQueryParams>();
  @Output() viewClick = new EventEmitter<TParent>();
  @Output() editClick = new EventEmitter<TParent>();
  @Output() deleteClick = new EventEmitter<TParent>();
  @Output() addClick = new EventEmitter<void>();
  @Output() refreshClick = new EventEmitter<void>();
  @Output() exportClick = new EventEmitter<void>();
  @Output() childViewClick = new EventEmitter<{ parent: TParent; child: TChild }>();
  @Output() childEditClick = new EventEmitter<{ parent: TParent; child: TChild }>();
  @Output() childDeleteClick = new EventEmitter<{ parent: TParent; child: TChild }>();
  @Output() rowExpand = new EventEmitter<TParent>();
  @Output() rowCollapse = new EventEmitter<TParent>();

  // ── Internal state ───────────────────────────────────────────────────────
  columnType = ColumnType;

  /** Set of expanded parent row keys */
  expandedRows = new Set<any>();

  /** Per-parent child pagination state */
  childPageState = new Map<any, { pageIndex: number; pageSize: number }>();

  /** Column visibility for parent */
  parentColumnVisibility: boolean[] = [];
  showColumnPicker = false;

  constructor(
    private readonly elRef: ElementRef<HTMLElement>,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && this.config) {
      this.parentColumnVisibility = this.config.parentColumns.map(() => true);
    }
  }

  // ── Column visibility ────────────────────────────────────────────────────
  get visibleParentColumns(): DataTableColumn<TParent>[] {
    return (this.config?.parentColumns ?? []).filter(
      (_, idx) => this.parentColumnVisibility[idx] !== false,
    );
  }

  toggleColumnPicker(event?: MouseEvent): void {
    event?.stopPropagation();
    this.showColumnPicker = !this.showColumnPicker;
  }

  setColumnVisible(index: number, visible: boolean): void {
    this.parentColumnVisibility[index] = visible;
    this.cdr.markForCheck();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showColumnPicker) return;
    const target = event.target as Node | null;
    if (target && this.elRef.nativeElement.contains(target)) return;
    this.showColumnPicker = false;
    this.cdr.markForCheck();
  }

  // ── Expand / Collapse ────────────────────────────────────────────────────
  toggleRow(parent: TParent): void {
    const key = this.config.parentTrackBy(parent);
    if (this.expandedRows.has(key)) {
      this.expandedRows.delete(key);
      this.rowCollapse.emit(parent);
    } else {
      this.expandedRows.add(key);
      if (!this.childPageState.has(key)) {
        this.childPageState.set(key, { pageIndex: 1, pageSize: this.childPageSize });
      }
      this.rowExpand.emit(parent);
    }
    this.cdr.markForCheck();
  }

  isExpanded(parent: TParent): boolean {
    return this.expandedRows.has(this.config.parentTrackBy(parent));
  }

  // ── Children ──────────────────────────────────────────────────────────────
  getPagedChildren(parent: TParent): TChild[] {
    const all = this.config.getChildren(parent) ?? [];
    const state = this.getChildPageState(parent);
    const start = (state.pageIndex - 1) * state.pageSize;
    return all.slice(start, start + state.pageSize);
  }

  getAllChildren(parent: TParent): TChild[] {
    return this.config.getChildren(parent) ?? [];
  }

  getChildPageState(parent: TParent): { pageIndex: number; pageSize: number } {
    const key = this.config.parentTrackBy(parent);
    if (!this.childPageState.has(key)) {
      this.childPageState.set(key, { pageIndex: 1, pageSize: this.childPageSize });
    }
    return this.childPageState.get(key)!;
  }

  childTotalPages(parent: TParent): number {
    return Math.ceil(this.getAllChildren(parent).length / this.getChildPageState(parent).pageSize);
  }

  onChildPageChange(parent: TParent, page: number): void {
    const state = this.getChildPageState(parent);
    const total = this.childTotalPages(parent);
    if (page >= 1 && page <= total && page !== state.pageIndex) {
      state.pageIndex = page;
      this.cdr.markForCheck();
    }
  }

  onChildPageSizeChange(parent: TParent, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const state = this.getChildPageState(parent);
    state.pageSize = Number(target.value);
    state.pageIndex = 1;
    this.cdr.markForCheck();
  }

  childVisiblePages(parent: TParent): number[] {
    const state = this.getChildPageState(parent);
    const total = this.childTotalPages(parent);
    const maxVisible = 5;
    let start = Math.max(1, state.pageIndex - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  childStartIndex(parent: TParent): number {
    const s = this.getChildPageState(parent);
    return (s.pageIndex - 1) * s.pageSize + 1;
  }

  childEndIndex(parent: TParent): number {
    const s = this.getChildPageState(parent);
    return Math.min(s.pageIndex * s.pageSize, this.getAllChildren(parent).length);
  }

  // ── Parent pagination ─────────────────────────────────────────────────────
  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
  }

  get startIndex(): number {
    return (this.pageIndex - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.pageIndex * this.pageSize, this.total);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.pageIndex - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
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
    this.pageChange.emit({ pageIndex: this.pageIndex, pageSize: this.pageSize });
    this.cdr.markForCheck();
  }

  // ── Colspan helpers ────────────────────────────────────────────────────────
  get parentColspan(): number {
    return (
      this.visibleParentColumns.length +
      (this.showIndex ? 1 : 0) +
      (this.showActionColumn ? 1 : 0) +
      1 // expand toggle column
    );
  }

  childColspan(childColumns: DataTableColumn<TChild>[]): number {
    return childColumns.length + (this.showActionColumn ? 1 : 0);
  }

  // ── Track by ──────────────────────────────────────────────────────────────
  trackParent = (index: number, item: TParent): any => {
    return this.config?.parentTrackBy ? this.config.parentTrackBy(item) : index;
  };

  trackChild = (index: number, item: TChild): any => {
    return this.config?.childTrackBy ? this.config.childTrackBy(item) : index;
  };
}
