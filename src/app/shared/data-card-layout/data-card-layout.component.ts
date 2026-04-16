import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { TableQueryParams } from '../data-table/models/table-query-params.model';
import {
  CardBodyTemplateDirective,
  CardFooterTemplateDirective,
} from './data-card-layout-templates.directive';

const DEFAULT_PAGE_SIZE = 10;

@Component({
  selector: 'app-data-card-layout',
  templateUrl: './data-card-layout.component.html',
  styleUrls: ['./data-card-layout.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataCardLayoutComponent<T> {
  @Input() data: T[] = [];
  @Input() loading = false;
  @Input() total = 0;
  @Input() pageSize = DEFAULT_PAGE_SIZE;
  @Input() pageIndex = 1;
  @Input() showPagination = true;
  @Input() noDataMessage = 'No data available';

  @Input() showAddButton = false;
  @Input() showRefreshButton = false;
  @Input() showDownloadButton = false;

  @Input() showViewButton = false;
  @Input() showEditButton = false;
  @Input() showDeleteButton = false;

  @Input() titleAccessor: (item: T) => string = () => '';
  @Input() createdDateAccessor?: (item: T) => Date | string | null | undefined;
  @Input() thumbnailUrlAccessor?: (item: T) => string | null | undefined;
  @Input() thumbnailAltAccessor: (item: T) => string = () => 'Thumbnail';

  @Output() pageChange = new EventEmitter<TableQueryParams>();
  @Output() addClick = new EventEmitter<void>();
  @Output() refreshClick = new EventEmitter<void>();
  @Output() downloadClick = new EventEmitter<void>();
  @Output() viewClick = new EventEmitter<T>();
  @Output() editClick = new EventEmitter<T>();
  @Output() deleteClick = new EventEmitter<T>();

  @ContentChild(CardBodyTemplateDirective) bodyTemplate?: CardBodyTemplateDirective<T>;
  @ContentChild(CardFooterTemplateDirective) footerTemplate?: CardFooterTemplateDirective<T>;

  pageSizeOptions = [10, 20, 50, 100];

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

  trackByIndex(index: number): number {
    return index;
  }

  getCardTitle(item: T): string {
    return this.titleAccessor ? this.titleAccessor(item) : '';
  }

  getCreatedDate(item: T): Date | string | null | undefined {
    return this.createdDateAccessor ? this.createdDateAccessor(item) : null;
  }

  getThumbnailUrl(item: T): string | null | undefined {
    return this.thumbnailUrlAccessor ? this.thumbnailUrlAccessor(item) : null;
  }

  private emitPageChange(): void {
    this.pageChange.emit({
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
    });
  }
}
