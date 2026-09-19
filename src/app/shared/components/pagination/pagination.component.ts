import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableQueryParams } from '../../data-table/models/table-query-params.model';

const MAX_VISIBLE_PAGES = 5;
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export type PaginationAccent = 'blue' | 'emerald';

// Full class names (not built by concatenation) so Tailwind's scanner picks them up.
const ACCENTS: Record<PaginationAccent, { active: string; select: string }> = {
  blue: {
    active: 'bg-blue-500 text-white border-blue-500',
    select: 'focus:ring-blue-500/50 focus:border-blue-500',
  },
  emerald: {
    active: 'bg-emerald-600 text-white border-emerald-600',
    select: 'focus:ring-emerald-500/40 focus:border-emerald-600',
  },
};

/**
 * The admin list footer (page-size select, "Showing x to y of z", first/prev/numbers/next/last),
 * as a standalone control. Pure: the parent owns `pageIndex` and updates it from `pageChange`.
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  @Input() total = 0;
  @Input() pageSize = 10;
  /** 1-based. */
  @Input() pageIndex = 1;
  /** Blocks every control, e.g. while the requested page is loading. */
  @Input() disabled = false;
  @Input() showPageSize = true;
  @Input() pageSizeOptions: number[] = DEFAULT_PAGE_SIZE_OPTIONS;
  /** Active-page / focus colour: admin blue, public-site emerald. */
  @Input() accent: PaginationAccent = 'blue';
  /** Below 1024px only the page buttons show (the tables' behaviour); false keeps all three. */
  @Input() collapseMetaOnMobile = true;

  @Output() pageChange = new EventEmitter<TableQueryParams>();

  /** The options plus the current size, so the select never shows a value that isn't there. */
  get sizeChoices(): number[] {
    return this.pageSizeOptions.includes(this.pageSize)
      ? this.pageSizeOptions
      : [...this.pageSizeOptions, this.pageSize].sort((a, b) => a - b);
  }

  get accentClasses(): { active: string; select: string } {
    return ACCENTS[this.accent];
  }

  get metaVisibility(): { flex: string; block: string } {
    return this.collapseMetaOnMobile
      ? { flex: 'hidden lg:flex', block: 'hidden lg:block' }
      : { flex: 'flex', block: 'block' };
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  get startIndex(): number {
    return this.total === 0 ? 0 : (this.pageIndex - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.pageIndex * this.pageSize, this.total);
  }

  get visiblePages(): number[] {
    const count = Math.min(MAX_VISIBLE_PAGES, this.totalPages);
    const start = Math.min(
      Math.max(1, this.pageIndex - Math.floor(MAX_VISIBLE_PAGES / 2)),
      this.totalPages - count + 1,
    );
    return Array.from({ length: count }, (_, i) => start + i);
  }

  onPageChange(page: number): void {
    if (!this.disabled && page >= 1 && page <= this.totalPages && page !== this.pageIndex) {
      this.pageChange.emit({ pageIndex: page, pageSize: this.pageSize });
    }
  }

  onPageSizeChange(event: Event): void {
    const pageSize = Number((event.target as HTMLSelectElement).value);
    if (!this.disabled && pageSize !== this.pageSize) {
      this.pageChange.emit({ pageIndex: 1, pageSize });
    }
  }
}
