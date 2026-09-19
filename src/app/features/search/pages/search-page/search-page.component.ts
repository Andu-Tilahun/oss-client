import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { TableQueryParams } from '../../../../shared/data-table/models/table-query-params.model';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { GlobalSearchService, MIN_QUERY_LENGTH } from '../../services/global-search.service';
import {
  SEARCH_PAGE_SIZE,
  SEARCH_TYPE_LABELS,
  SearchOutcome,
  SearchResult,
  SearchResultType,
} from '../../models/search-result.model';

interface TypeChip {
  type: SearchResultType;
  label: string;
  total: number;
}

/** A request for one page of a single type; `null` cancels whatever is in flight. */
interface TypePageRequest {
  query: string;
  type: SearchResultType;
  page: number;
  size: number;
  previousPage: number;
  previousSize: number;
}

const TYPE_TAG_CLASSES: Record<SearchResultType, string> = {
  'user': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'farm-plot': 'bg-green-100 text-green-700 border-green-200',
  'investment-package': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'agreement': 'bg-blue-100 text-blue-700 border-blue-200',
  'investor-record': 'bg-sky-100 text-sky-700 border-sky-200',
  'follow-up': 'bg-amber-100 text-amber-700 border-amber-200',
  'payment': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'news': 'bg-rose-100 text-rose-700 border-rose-200',
  'gallery': 'bg-pink-100 text-pink-700 border-pink-200',
  'region': 'bg-teal-100 text-teal-700 border-teal-200',
  'template': 'bg-purple-100 text-purple-700 border-purple-200',
  'bank-account': 'bg-slate-100 text-slate-700 border-slate-200',
};

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  templateUrl: './search-page.component.html',
})
export class SearchPageComponent implements OnInit {
  private readonly searchService = inject(GlobalSearchService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly queries$ = new Subject<string>();
  private readonly typePages$ = new Subject<TypePageRequest | null>();

  readonly minLength = MIN_QUERY_LENGTH;
  /** How many matches per type the fan-out fetches up front (fixed). */
  readonly fetchSize = SEARCH_PAGE_SIZE;
  readonly pageSizeOptions = [10, 20, 50, 100];
  readonly skeletonCards = Array.from({ length: SEARCH_PAGE_SIZE }, (_, i) => i);

  query = '';
  loading = false;
  searched = false;
  failedTypes: SearchResultType[] = [];
  activeType: SearchResultType | null = null;
  /** 1-based page within the current view (all types, or the selected type). */
  page = 1;
  pageLoading = false;
  /** Cards per page; the user can change it from the pagination footer. */
  pageSize = SEARCH_PAGE_SIZE;

  /** First page of every type, merged in type order. */
  private allResults: SearchResult[] = [];
  private typeTotals: Partial<Record<SearchResultType, number>> = {};
  /** Current page of the selected type (server-paged beyond the first page). */
  private typeResults: SearchResult[] = [];
  /** The trimmed query the visible results belong to. */
  private activeQuery = '';

  ngOnInit(): void {
    this.queries$
      .pipe(
        map(query => query.trim()),
        debounceTime(300),
        distinctUntilChanged(),
        tap(query => {
          this.typePages$.next(null);
          this.pageLoading = false;
          this.loading = query.length >= this.minLength;
          if (query.length < this.minLength) {
            this.reset();
          }
        }),
        // switchMap cancels the previous in-flight fan-out when the admin keeps typing.
        switchMap(query =>
          query.length < this.minLength
            ? of<SearchOutcome>({ results: [], totals: {}, failedTypes: [] })
            : this.searchService.search(query).pipe(
              tap(() => (this.activeQuery = query)),
              catchError(() => of<SearchOutcome>({ results: [], totals: {}, failedTypes: [] })),
            ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(outcome => this.showOutcome(outcome));

    this.typePages$
      .pipe(
        // A newer page click (or a new query) cancels the slower earlier page request.
        switchMap(request => request
          ? this.searchService.searchType(request.query, request.type, request.page - 1, request.size).pipe(
            map(result => ({ request, result })),
            catchError(() => of({ request, result: null })),
          )
          : of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(outcome => {
        if (!outcome) {
          return;
        }
        this.pageLoading = false;
        if (outcome.result) {
          this.typeResults = outcome.result.results;
          this.typeTotals = { ...this.typeTotals, [outcome.request.type]: outcome.result.total };
        } else {
          this.page = outcome.request.previousPage;
          this.pageSize = outcome.request.previousSize;
        }
      });
  }

  onQueryChange(value: string): void {
    this.query = value;
    this.queries$.next(value);
  }

  clear(): void {
    this.onQueryChange('');
  }

  selectType(type: SearchResultType | null): void {
    this.typePages$.next(null);
    this.pageLoading = false;
    this.activeType = this.activeType === type ? null : type;
    this.page = 1;
    this.typeResults = [];
    if (this.activeType) {
      this.loadTypePage(1, 1, this.pageSize);
    }
  }

  /** Handles the shared paginator: a new size restarts at page 1, otherwise it is a page jump. */
  onPagination(params: TableQueryParams): void {
    if (params.pageSize !== this.pageSize) {
      const previousPage = this.page;
      const previousSize = this.pageSize;
      this.pageSize = params.pageSize;
      this.page = 1;
      if (this.activeType) {
        this.loadTypePage(1, previousPage, previousSize);
      }
      return;
    }
    this.goToPage(params.pageIndex);
  }

  goToPage(page: number): void {
    const target = Math.min(Math.max(page, 1), this.totalPages);
    if (target === this.page || this.loading) {
      return;
    }
    const previousPage = this.page;
    this.page = target; // the all-types view is paged in the browser
    if (this.activeType) {
      this.loadTypePage(target, previousPage, this.pageSize);
    }
  }

  /**
   * Shows `page` of the selected type. The first page of every type is already loaded (at the
   * fetch size), so it is reused when the page size matches; everything else is a server request.
   */
  private loadTypePage(page: number, previousPage: number, previousSize: number): void {
    const type = this.activeType!;
    this.typePages$.next(null);
    if (page === 1 && this.pageSize === this.fetchSize) {
      this.pageLoading = false;
      this.typeResults = this.allResults.filter(r => r.type === type);
      return;
    }
    // Keep something on screen while the request runs.
    this.typeResults = page === 1 ? this.allResults.filter(r => r.type === type).slice(0, this.pageSize) : this.typeResults;
    this.pageLoading = true;
    this.typePages$.next({ query: this.activeQuery, type, page, size: this.pageSize, previousPage, previousSize });
  }

  get chips(): TypeChip[] {
    return (Object.keys(this.typeTotals) as SearchResultType[])
      .filter(type => (this.typeTotals[type] ?? 0) > 0)
      .map(type => ({ type, label: SEARCH_TYPE_LABELS[type], total: this.typeTotals[type]! }));
  }

  /** Types with more matches than the all-types view shows; pointing the admin at their chip. */
  get truncatedTypes(): TypeChip[] {
    return this.activeType ? [] : this.chips.filter(chip => chip.total > this.fetchSize);
  }

  get pagedResults(): SearchResult[] {
    if (this.activeType) {
      return this.typeResults;
    }
    const start = (this.page - 1) * this.pageSize;
    return this.allResults.slice(start, start + this.pageSize);
  }

  get total(): number {
    return this.activeType ? (this.typeTotals[this.activeType] ?? 0) : this.allResults.length;
  }

  get totalResults(): number {
    return this.allResults.length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  get tooShort(): boolean {
    return this.query.trim().length < this.minLength;
  }

  typeLabel(type: SearchResultType): string {
    return SEARCH_TYPE_LABELS[type];
  }

  typeClass(type: SearchResultType): string {
    return TYPE_TAG_CLASSES[type];
  }

  trackByResult(_: number, result: SearchResult): string {
    return `${result.type}:${result.id}`;
  }

  private reset(): void {
    this.searched = false;
    this.allResults = [];
    this.typeTotals = {};
    this.typeResults = [];
    this.failedTypes = [];
    this.activeType = null;
    this.activeQuery = '';
    this.page = 1;
  }

  private showOutcome(outcome: SearchOutcome): void {
    this.allResults = outcome.results;
    this.typeTotals = outcome.totals;
    this.typeResults = [];
    this.failedTypes = outcome.failedTypes;
    this.activeType = null;
    this.page = 1;
    this.searched = !this.tooShort;
    this.loading = false;
  }
}
