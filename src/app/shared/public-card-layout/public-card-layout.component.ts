import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { TableQueryParams } from '../data-table/models/table-query-params.model';

const DEFAULT_PAGE_SIZE = 10;

@Component({
  selector: 'app-public-card-layout',
  templateUrl: './public-card-layout.component.html',
  styleUrls: ['./public-card-layout.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicCardLayoutComponent<T> implements AfterViewInit, OnDestroy {
  @Input() data: T[] = [];
  @Input() loading = false;
  @Input() total = 0;
  @Input() pageSize = DEFAULT_PAGE_SIZE;
  @Input() pageIndex = 1;
  @Input() showPagination = true;
  @Input() noDataMessage = 'No data available';
  @Input() showRefreshButton = false;

  /** When true, replaces the numbered pager's role: emits (nearEnd) once the user scrolls to
   *  within `nearEndThreshold` cards of the end of the currently rendered `data`, instead of
   *  requiring a page click. Off by default — existing consumers (e.g. public-plots) are unaffected. */
  @Input() infiniteScroll = false;
  @Input() nearEndThreshold = 5;
  @Output() nearEnd = new EventEmitter<void>();

  @Input() titleAccessor: (item: T) => string = () => '';
  @Input() subtitleAccessor: (item: T) => string = () => '';
  @Input() descriptionAccessor: (item: T) => string = () => '';
  @Input() imageUrlAccessor?: (item: T) => string | null | undefined;
  @Input() imageAltAccessor: (item: T) => string = () => 'Card image';
  @Input() badgesAccessor: (item: T) => string[] = () => [];

  @Input() primaryActionLabel = 'Reserve now';
  @Input() secondaryActionLabel = 'Gallery';
  @Input() showSecondaryAction = true;

  @Output() pageChange = new EventEmitter<TableQueryParams>();
  @Output() refreshClick = new EventEmitter<void>();
  @Output() primaryActionClick = new EventEmitter<T>();
  @Output() secondaryActionClick = new EventEmitter<T>();

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

    for (let index = start; index <= end; index++) {
      pages.push(index);
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

  getImageUrl(item: T): string | null | undefined {
    return this.imageUrlAccessor ? this.imageUrlAccessor(item) : null;
  }

  @ViewChildren('cardEl') private cardEls?: QueryList<ElementRef<HTMLElement>>;
  private observer?: IntersectionObserver;
  private changesSub?: Subscription;

  ngAfterViewInit(): void {
    if (!this.infiniteScroll || typeof IntersectionObserver === 'undefined' || !this.cardEls) {
      return;
    }
    this.changesSub = this.cardEls.changes.subscribe(() => this.observeNearEndCard());
    this.observeNearEndCard();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.changesSub?.unsubscribe();
  }

  /** Re-targets the observer at the card sitting `nearEndThreshold` positions before the end of
   *  the currently rendered list, so the trigger point automatically follows the list as it grows
   *  with each appended batch. */
  private observeNearEndCard(): void {
    if (!this.cardEls) return;
    const cards = this.cardEls.toArray();
    const targetIndex = cards.length - 1 - this.nearEndThreshold;
    const target = targetIndex >= 0 ? cards[targetIndex]?.nativeElement : undefined;

    this.observer?.disconnect();
    if (!target) return;

    this.observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        this.nearEnd.emit();
      }
    });
    this.observer.observe(target);
  }

  private emitPageChange(): void {
    this.pageChange.emit({
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
    });
  }
}
