import { describe, it, expect, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { SearchPageComponent } from './search-page.component';
import { GlobalSearchService } from '../../services/global-search.service';
import { SearchOutcome, SearchPage, SearchResult, SearchResultType } from '../../models/search-result.model';

function result(overrides: Partial<SearchResult>): SearchResult {
  return {
    id: 'r1',
    type: 'user',
    title: 'Jane Doe',
    description: 'jane@x.com',
    tags: ['INVESTOR'],
    route: { commands: ['/users', 'r1'] },
    ...overrides,
  };
}

/** Builds an outcome, deriving per-type totals from the results unless overridden. */
function outcomeOf(results: SearchResult[], totals?: Partial<Record<SearchResultType, number>>, failedTypes: SearchResultType[] = []): SearchOutcome {
  const derived: Partial<Record<SearchResultType, number>> = {};
  for (const r of results) derived[r.type] = (derived[r.type] ?? 0) + 1;
  return { results, totals: { ...derived, ...totals }, failedTypes };
}

const EMPTY = outcomeOf([]);

function users(count: number, from = 0): SearchResult[] {
  return Array.from({ length: count }, (_, i) => result({ id: `u${from + i}`, title: `User ${from + i}` }));
}

function makeHarness(
  outcome: SearchOutcome | (() => any) = EMPTY,
  searchType: (query: string, type: SearchResultType, page: number) => any = () => of({ results: [], total: 0 } as SearchPage),
) {
  const searchService = {
    search: vi.fn(typeof outcome === 'function' ? outcome : () => of(outcome)),
    searchType: vi.fn(searchType),
  };
  TestBed.configureTestingModule({
    imports: [SearchPageComponent],
    providers: [provideRouter([]), { provide: GlobalSearchService, useValue: searchService }],
  });
  const fixture = TestBed.createComponent(SearchPageComponent);
  fixture.detectChanges();
  const type = (value: string) => {
    fixture.componentInstance.onQueryChange(value);
    vi.advanceTimersByTime(300);
    fixture.detectChanges();
  };
  const cards = () => Array.from(el.querySelectorAll<HTMLAnchorElement>('a'));
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, component: fixture.componentInstance, searchService, type, el, cards };
}

describe('SearchPageComponent', () => {
  afterEach(() => vi.useRealTimers());

  it('asks the user to type at least 2 characters before searching', () => {
    vi.useFakeTimers();
    const { el, searchService, type } = makeHarness();

    type('a');

    expect(el.textContent).toContain('Type at least 2 characters');
    expect(searchService.search).not.toHaveBeenCalledWith('a');
  });

  it('debounces typing into a single search for the final text', () => {
    vi.useFakeTimers();
    const { component, searchService } = makeHarness();

    component.onQueryChange('ja');
    vi.advanceTimersByTime(100);
    component.onQueryChange('jan');
    vi.advanceTimersByTime(100);
    component.onQueryChange('jane');
    vi.advanceTimersByTime(300);

    expect(searchService.search).toHaveBeenCalledTimes(1);
    expect(searchService.search).toHaveBeenCalledWith('jane');
  });

  it('renders title, description, a type tag and status tags, linking to the record', () => {
    vi.useFakeTimers();
    const { el, type } = makeHarness(outcomeOf([result({ title: 'Jane Doe', description: 'jane@x.com', tags: ['INVESTOR'] })]));

    type('jane');

    const row = el.querySelector('a')!;
    expect(row.textContent).toContain('Jane Doe');
    expect(row.textContent).toContain('jane@x.com');
    expect(row.textContent).toContain('User');
    expect(row.textContent).toContain('INVESTOR');
    expect(row.getAttribute('href')).toBe('/users/r1');
  });

  it('puts query params on the link for records opened via ?id=', () => {
    vi.useFakeTimers();
    const { el, type } = makeHarness(outcomeOf([result({
      type: 'farm-plot', id: 'f1', title: 'Green Plot',
      route: { commands: ['/farm-plots'], queryParams: { id: 'f1' } },
    })]));

    type('green');

    expect(el.querySelector('a')!.getAttribute('href')).toBe('/farm-plots?id=f1');
  });

  it('shows a chip per matching type with its total and lets a chip narrow the cards', () => {
    vi.useFakeTimers();
    const { component, el, fixture, type, cards } = makeHarness(outcomeOf([
      result({ id: 'u1', type: 'user', title: 'Jane' }),
      result({ id: 'n1', type: 'news', title: 'Harvest news', route: { commands: ['/system-config/news'], queryParams: { id: 'n1' } } }),
    ]));

    type('ha');
    expect(component.chips.map(c => c.type)).toEqual(['user', 'news']);
    expect(cards()).toHaveLength(2);

    component.selectType('news');
    fixture.detectChanges();
    expect(cards()).toHaveLength(1);
    expect(el.textContent).toContain('Harvest news');

    component.selectType('news');
    fixture.detectChanges();
    expect(cards()).toHaveLength(2);
  });

  it('says so when nothing matches', () => {
    vi.useFakeTimers();
    const { el, type } = makeHarness(EMPTY);

    type('zzzz');

    expect(el.textContent).toContain('No records match');
    expect(el.textContent).toContain('zzzz');
  });

  it('warns which record types could not be searched but keeps showing the rest', () => {
    vi.useFakeTimers();
    const { el, type } = makeHarness(outcomeOf([result({})], undefined, ['payment', 'news']));

    type('jane');

    expect(el.textContent).toContain("Couldn't search: Payment, News");
    expect(el.querySelectorAll('a')).toHaveLength(1);
  });

  it('cancels a slow earlier search when a newer one starts', () => {
    vi.useFakeTimers();
    const slow = new Subject<SearchOutcome>();
    let calls = 0;
    const { component, type } = makeHarness(() => (++calls === 1 ? slow : of(outcomeOf([result({ title: 'Newer' })]))));

    type('first');
    type('second');
    slow.next(outcomeOf([result({ title: 'Stale' })]));

    expect(component.pagedResults[0].title).toBe('Newer');
  });

  it('clears results when the input is cleared', () => {
    vi.useFakeTimers();
    const { component, type } = makeHarness(outcomeOf([result({})]));
    type('jane');
    expect(component.totalResults).toBe(1);

    component.clear();
    vi.advanceTimersByTime(300);

    expect(component.totalResults).toBe(0);
    expect(component.query).toBe('');
  });

  describe('cards and pagination', () => {
    it('lays results out as a 5-column card grid at wide widths', () => {
      vi.useFakeTimers();
      const { el, type } = makeHarness(outcomeOf(users(3)));

      type('user');

      const grid = el.querySelector('a')!.parentElement!;
      expect(grid.className).toContain('xl:grid-cols-5');
    });

    it('shows 20 cards per page and keeps the footer so the page size can still be changed', () => {
      vi.useFakeTimers();
      const { el, type, cards } = makeHarness(outcomeOf(users(20)));

      type('user');

      expect(cards()).toHaveLength(20);
      expect(el.querySelector('app-pagination select')).not.toBeNull();
    });

    it('pages the all-types view in the browser without any extra request', () => {
      vi.useFakeTimers();
      const { component, el, fixture, searchService, type, cards } = makeHarness(outcomeOf([
        ...users(20),
        ...users(5, 20).map(r => ({ ...r, type: 'news' as const })),
      ]));

      type('user');
      expect(component.totalPages).toBe(2);
      expect(el.querySelector('app-pagination')!.textContent).toContain('Showing 1 to 20 of 25 results');

      component.goToPage(2);
      fixture.detectChanges();

      expect(cards()).toHaveLength(5);
      expect(el.querySelector('app-pagination')!.textContent).toContain('Showing 21 to 25 of 25 results');
      expect(searchService.searchType).not.toHaveBeenCalled();
    });

    it('goes to the page picked in the shared paginator and locks it while a page loads', () => {
      vi.useFakeTimers();
      const { el, fixture, type } = makeHarness(outcomeOf(users(45)));
      type('user');

      const next = Array.from(el.querySelectorAll<HTMLButtonElement>('app-pagination button'))
        .find(b => b.textContent?.trim() === '2')!;
      next.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.page).toBe(2);
      expect(el.querySelector('app-pagination [aria-current="page"]')!.textContent!.trim()).toBe('2');
    });

    it('resets to page 1 on a new search', () => {
      vi.useFakeTimers();
      const { component, type } = makeHarness(outcomeOf(users(45)));
      type('user');
      component.goToPage(3);
      expect(component.page).toBe(3);

      type('users');

      expect(component.page).toBe(1);
    });

    it('offers to browse a type that has more matches than the first page', () => {
      vi.useFakeTimers();
      const { el, type } = makeHarness(outcomeOf(users(20), { user: 137 }));

      type('user');

      expect(el.textContent).toContain('browse all 137 User results');
    });

    it('pages a selected type on the server, reusing the first page it already has', () => {
      vi.useFakeTimers();
      const { component, fixture, searchService, type, cards } = makeHarness(
        outcomeOf(users(20), { user: 137 }),
        () => of({ results: users(20, 20), total: 137 }),
      );
      type('user');

      component.selectType('user');
      expect(component.totalPages).toBe(7);
      expect(searchService.searchType).not.toHaveBeenCalled();

      component.goToPage(2);
      fixture.detectChanges();

      expect(searchService.searchType).toHaveBeenCalledTimes(1);
      expect(searchService.searchType).toHaveBeenCalledWith('user', 'user', 1, 20);
      expect(cards()[0].textContent).toContain('User 20');

      component.goToPage(1);
      fixture.detectChanges();

      expect(searchService.searchType).toHaveBeenCalledTimes(1);
      expect(cards()[0].textContent).toContain('User 0');
    });

    it('keeps the previous page and page number when a page request fails', () => {
      vi.useFakeTimers();
      const { component, type } = makeHarness(
        outcomeOf(users(20), { user: 60 }),
        () => throwError(() => new Error('boom')),
      );
      type('user');
      component.selectType('user');

      component.goToPage(2);

      expect(component.page).toBe(1);
      expect(component.pageLoading).toBe(false);
      expect(component.pagedResults).toHaveLength(20);
    });

    it('cancels a slow page request when another page is chosen', () => {
      vi.useFakeTimers();
      const slow = new Subject<SearchPage>();
      let calls = 0;
      const { component, type } = makeHarness(
        outcomeOf(users(20), { user: 100 }),
        () => (++calls === 1 ? slow : of({ results: users(1, 60), total: 100 })),
      );
      type('user');
      component.selectType('user');

      component.goToPage(2);
      component.goToPage(4);
      slow.next({ results: users(1, 20), total: 100 });

      expect(component.page).toBe(4);
      expect(component.pagedResults[0].title).toBe('User 60');
    });

    it('drops an in-flight page request when the query changes', () => {
      vi.useFakeTimers();
      const slow = new Subject<SearchPage>();
      const { component, type } = makeHarness(
        outcomeOf(users(20), { user: 100 }),
        () => slow,
      );
      type('user');
      component.selectType('user');
      component.goToPage(2);

      type('users');
      slow.next({ results: users(1, 20), total: 100 });

      expect(component.activeType).toBeNull();
      expect(component.page).toBe(1);
      expect(component.pagedResults[0].title).toBe('User 0');
    });

    describe('page size', () => {
      const selectSize = (el: HTMLElement, fixture: any, size: string) => {
        const select = el.querySelector<HTMLSelectElement>('app-pagination select')!;
        select.value = size;
        select.dispatchEvent(new Event('change'));
        fixture.detectChanges();
      };

      it('offers the size dropdown defaulting to 20', () => {
        vi.useFakeTimers();
        const { el, type } = makeHarness(outcomeOf(users(30)));
        type('user');

        const select = el.querySelector<HTMLSelectElement>('app-pagination select')!;
        expect(select.value).toBe('20');
        expect(Array.from(select.options).map(o => o.value)).toEqual(['10', '20', '50', '100']);
      });

      it('re-slices the all-types view in the browser without any request', () => {
        vi.useFakeTimers();
        const { component, el, fixture, searchService, type, cards } = makeHarness(outcomeOf(users(45)));
        type('user');
        component.goToPage(3);

        selectSize(el, fixture, '10');

        expect(component.pageSize).toBe(10);
        expect(component.page).toBe(1);
        expect(cards()).toHaveLength(10);
        expect(component.totalPages).toBe(5);
        expect(searchService.searchType).not.toHaveBeenCalled();

        selectSize(el, fixture, '50');
        expect(cards()).toHaveLength(45);
        expect(searchService.searchType).not.toHaveBeenCalled();
      });

      it('asks the server for the new size when a type is selected', () => {
        vi.useFakeTimers();
        const { component, el, fixture, searchService, type } = makeHarness(
          outcomeOf(users(20), { user: 137 }),
          (_q, _t, _page, size) => of({ results: users(size), total: 137 }),
        );
        type('user');
        component.selectType('user');

        selectSize(el, fixture, '10');

        expect(searchService.searchType).toHaveBeenCalledWith('user', 'user', 0, 10);
        expect(component.page).toBe(1);
        expect(component.pagedResults).toHaveLength(10);
        expect(component.totalPages).toBe(14);
      });

      it('reuses the loaded first page again when the size returns to 20', () => {
        vi.useFakeTimers();
        const { component, el, fixture, searchService, type } = makeHarness(
          outcomeOf(users(20), { user: 137 }),
          (_q, _t, _page, size) => of({ results: users(size), total: 137 }),
        );
        type('user');
        component.selectType('user');
        selectSize(el, fixture, '50');
        expect(searchService.searchType).toHaveBeenCalledTimes(1);

        selectSize(el, fixture, '20');

        expect(searchService.searchType).toHaveBeenCalledTimes(1);
        expect(component.pagedResults).toHaveLength(20);
      });

      it('goes back to the previous page and size when the request fails', () => {
        vi.useFakeTimers();
        const { component, type } = makeHarness(
          outcomeOf(users(20), { user: 137 }),
          () => throwError(() => new Error('boom')),
        );
        type('user');
        component.selectType('user');
        component.onPagination({ pageIndex: 1, pageSize: 50 });

        expect(component.pageSize).toBe(20);
        expect(component.page).toBe(1);
        expect(component.pageLoading).toBe(false);
      });

      it('keeps the truncation hint tied to the fetch size, not the chosen size', () => {
        vi.useFakeTimers();
        const { component, type } = makeHarness(outcomeOf(users(20), { user: 137 }));
        type('user');
        component.onPagination({ pageIndex: 1, pageSize: 50 });

        expect(component.truncatedTypes.map(c => c.type)).toEqual(['user']);
      });
    });
  });
});
