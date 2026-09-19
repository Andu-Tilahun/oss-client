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
  CardHeaderRightTemplateDirective,
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

  /**
   * When enabled, clicking the card body (thumbnail area) emits `cardClick`.
   * Footer buttons are not affected because they live outside the body wrapper.
   */
  @Input() cardClickEnabled = false;

  @Input() titleAccessor: (item: T) => string = () => '';
  @Input() createdDateAccessor?: (item: T) => Date | string | null | undefined;
  @Input() thumbnailUrlAccessor?: (item: T) => string | null | undefined;
  @Input() thumbnailAltAccessor: (item: T) => string = () => 'Thumbnail';
  @Input() showCreatedDate = true;

  @Output() pageChange = new EventEmitter<TableQueryParams>();
  @Output() addClick = new EventEmitter<void>();
  @Output() refreshClick = new EventEmitter<void>();
  @Output() downloadClick = new EventEmitter<void>();
  @Output() viewClick = new EventEmitter<T>();
  @Output() editClick = new EventEmitter<T>();
  @Output() deleteClick = new EventEmitter<T>();
  @Output() cardClick = new EventEmitter<T>();

  @ContentChild(CardHeaderRightTemplateDirective) headerRightTemplate?: CardHeaderRightTemplateDirective<T>;
  @ContentChild(CardBodyTemplateDirective) bodyTemplate?: CardBodyTemplateDirective<T>;
  @ContentChild(CardFooterTemplateDirective) footerTemplate?: CardFooterTemplateDirective<T>;

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

  onPaginationChange(params: TableQueryParams): void {
    this.pageIndex = params.pageIndex;
    this.pageSize = params.pageSize;
    this.emitPageChange();
  }

  private emitPageChange(): void {
    this.pageChange.emit({
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
    });
  }
}
