import { describe, it, expect, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { GlobalSearchService } from './global-search.service';
import { RequestType } from '../../../core/services/http.service';

const page = (content: unknown[]) => ({ content, totalElements: content.length });

/** Routes each mocked HttpService call by URL so a test only describes the types it cares about. */
function makeService(responses: Record<string, unknown> = {}, failing: string[] = []) {
  const respond = (url: string) => {
    if (failing.some(f => url.includes(f))) return throwError(() => new Error('boom'));
    const key = Object.keys(responses).find(k => url.includes(k));
    if (key) return of(responses[key]);
    return of(url.includes('/followups') || url.includes('/templates') || url.includes('/bank-accounts')
      ? [] : page([]));
  };
  const http = {
    post: vi.fn((url: string) => respond(url)),
    put: vi.fn((url: string) => respond(url)),
    get: vi.fn((url: string) => respond(url)),
  };
  return { service: new GlobalSearchService(http as any), http };
}

const many = (n: number, total = n) => ({
  content: Array.from({ length: n }, (_, i) => ({ id: `u${i}`, firstName: 'User', lastName: `${i}`, username: `u${i}`, email: 'e@x.com', role: 'ADMIN' })),
  totalElements: total,
});

function search(service: GlobalSearchService, query: string) {
  let outcome: any;
  service.search(query).subscribe(o => (outcome = o));
  return outcome;
}

describe('GlobalSearchService', () => {
  it('does not call any backend for queries shorter than 2 characters', () => {
    const { service, http } = makeService();

    expect(search(service, ' a ')).toEqual({ results: [], totals: {}, failedTypes: [] });
    expect(http.post).not.toHaveBeenCalled();
    expect(http.put).not.toHaveBeenCalled();
    expect(http.get).not.toHaveBeenCalled();
  });

  it('searches every record type and merges the results', () => {
    const { service, http } = makeService();

    search(service, 'farm');

    // 12 record types: users, plots, packages, agreements, records, follow-ups, payments,
    // news, gallery, regions, templates, bank accounts.
    expect(http.post.mock.calls.length + http.put.mock.calls.length + http.get.mock.calls.length).toBe(12);
  });

  it('runs every call quietly: no global spinner/toast and no 403 force-logout', () => {
    const { service, http } = makeService();

    search(service, 'farm');

    const optionsPassed = [...http.post.mock.calls, ...http.put.mock.calls, ...http.get.mock.calls]
      .map(call => call[call.length - 1]);
    expect(optionsPassed).toHaveLength(12);
    for (const options of optionsPassed) {
      expect(options).toEqual({ requestType: RequestType.NON_BLOCKING, skipAuthRedirect: true });
    }
  });

  it('maps users into a title, description and role tag linking to the user page', () => {
    const { service } = makeService({
      '/users/filter': page([{ id: 'u1', firstName: 'Jane', lastName: 'Doe', username: 'jdoe', email: 'jane@x.com', role: 'INVESTOR' }]),
    });

    const { results } = search(service, 'jane');

    expect(results).toEqual([{
      id: 'u1',
      type: 'user',
      title: 'Jane Doe',
      description: 'jane@x.com · @jdoe',
      tags: ['INVESTOR'],
      route: { commands: ['/users', 'u1'] },
    }]);
  });

  it('sends the query with a 20-record page size to text-search endpoints', () => {
    const { service, http } = makeService();

    search(service, 'maize');

    expect(http.post).toHaveBeenCalledWith(
      expect.stringContaining('/users/filter'),
      { searchText: 'maize', page: 0, size: 20 },
      undefined,
      expect.anything(),
    );
  });

  it('sends the payment query as a search param', () => {
    const { service, http } = makeService();

    search(service, 'ORD-9');

    const paymentCall = http.get.mock.calls.find(c => String(c[0]).endsWith('/payments'))!;
    expect(paymentCall[2].get('search')).toBe('ORD-9');
    expect(paymentCall[2].get('size')).toBe('20');
  });

  it('routes an archived package to the archived tab and a follow-up to its package panel', () => {
    const { service } = makeService({
      '/investment-packages/filter': page([{ id: 'p1', title: 'Teff', packageStatus: 'COMPLITED', fundingStatus: 'FUNDED', investmentPackageType: 'LEASING' }]),
      '/followups/admin': [{ id: 'f1', externalId: 'p2', referenceNumber: 'FLW-1', remark: 'Check teff soil', taskStatus: 'ACTIVE' }],
    });

    const { results } = search(service, 'teff');

    const pkg = results.find((r: any) => r.type === 'investment-package');
    expect(pkg.route.queryParams).toEqual({ id: 'p1', tab: 'archived' });
    const followUp = results.find((r: any) => r.type === 'follow-up');
    expect(followUp.route).toEqual({ commands: ['/investment-package'], queryParams: { id: 'p2', panel: 'follow-up' } });
  });

  it('routes agreements to the package contract panel', () => {
    const { service } = makeService({
      '/investment-agreements/filter': page([{ id: 'a1', investmentPackageId: 'p3', farmPlot: { title: 'Green Plot' }, status: 'ACTIVE', totalAmount: 500 }]),
    });

    const { results } = search(service, 'green');

    expect(results[0].route.queryParams).toEqual({ id: 'p3', panel: 'contract' });
    expect(results[0].title).toContain('Green Plot');
  });

  it('keeps returning other types and reports the ones that failed', () => {
    const { service } = makeService({
      '/users/filter': page([{ id: 'u1', firstName: 'Jane', lastName: 'Doe', username: 'j', email: 'e', role: 'ADMIN' }]),
    }, ['/payments', '/news']);

    const { results, failedTypes } = search(service, 'jane');

    expect(results.map((r: any) => r.type)).toEqual(['user']);
    expect([...failedTypes].sort()).toEqual(['news', 'payment']);
  });

  it('masks bank account numbers in results but still matches on them', () => {
    const { service } = makeService({
      '/bank-accounts/all': [{ id: 'b1', bankName: 'CBE', accountHolderName: 'ABC PLC', accountNumber: '1000123456789', active: true, displayOrder: 0 }],
    });

    const { results } = search(service, '123456');

    expect(results).toHaveLength(1);
    expect(results[0].description).toBe('ABC PLC · •••• 6789');
    expect(JSON.stringify(results[0])).not.toContain('1000123456789');
  });

  it('filters templates in the browser and routes by template type', () => {
    const { service } = makeService({
      '/templates': [
        { id: 't1', name: 'Payment Reminder', type: 'SMS', subject: 'Pay', purpose: 'PAYMENT_REMINDER', active: true, body: '' },
        { id: 't2', name: 'Welcome', type: 'EMAIL', subject: 'Hi', purpose: 'WELCOME', active: true, body: '' },
      ],
    });

    const { results } = search(service, 'reminder');

    expect(results).toHaveLength(1);
    expect(results[0].route).toEqual({ commands: ['/templates', 'sms'], queryParams: { id: 't1' } });
  });

  it('fetches the unpaged lists once per minute, not on every keystroke', () => {
    const { service, http } = makeService();

    search(service, 'fa');
    search(service, 'far');
    search(service, 'farm');

    const followUpFetches = http.get.mock.calls.filter(c => String(c[0]).includes('/followups')).length;
    const templateFetches = http.get.mock.calls.filter(c => String(c[0]).includes('/templates')).length;
    expect(followUpFetches).toBe(1);
    expect(templateFetches).toBe(1);
  });

  it('does not cache a failed list fetch', () => {
    let fail = true;
    const http = {
      post: vi.fn(() => of(page([]))),
      put: vi.fn(() => of(page([]))),
      get: vi.fn((url: string) => {
        if (url.includes('/followups')) return fail ? throwError(() => new Error('x')) : of([]);
        return url.includes('/payments') ? of(page([])) : of([]);
      }),
    };
    const service = new GlobalSearchService(http as any);

    expect(search(service, 'ab').failedTypes).toContain('follow-up');
    fail = false;
    expect(search(service, 'ab').failedTypes).not.toContain('follow-up');
  });

  describe('paging', () => {
    it('reports the real number of matches per type, not just the first page', () => {
      const { service } = makeService({ '/users/filter': many(20, 137) });

      const { results, totals } = search(service, 'user');

      expect(results.filter((r: any) => r.type === 'user')).toHaveLength(20);
      expect(totals.user).toBe(137);
    });

    it('leaves failed types out of the totals', () => {
      const { service } = makeService({}, ['/payments']);

      const { totals, failedTypes } = search(service, 'user');

      expect(failedTypes).toEqual(['payment']);
      expect('payment' in totals).toBe(false);
    });

    it('searchType asks only that type for the requested zero-based page', () => {
      const { service, http } = makeService({ '/users/filter': many(20, 137) });

      let result: any;
      service.searchType(' user ', 'user', 2).subscribe(r => (result = r));

      expect(http.post).toHaveBeenCalledTimes(1);
      expect(http.put).not.toHaveBeenCalled();
      expect(http.get).not.toHaveBeenCalled();
      expect(http.post).toHaveBeenCalledWith(
        expect.stringContaining('/users/filter'),
        { searchText: 'user', page: 2, size: 20 },
        undefined,
        expect.anything(),
      );
      expect(result.total).toBe(137);
      expect(result.results).toHaveLength(20);
    });

    it('searchType pages payments through the page query param', () => {
      const { service, http } = makeService();

      service.searchType('ORD', 'payment', 3).subscribe();

      const call = http.get.mock.calls.find(c => String(c[0]).endsWith('/payments'))!;
      expect(call[2].get('page')).toBe('3');
      expect(call[2].get('size')).toBe('20');
    });

    it('pages in-memory types by slicing the filtered list, with the full filtered count as total', () => {
      const templates = Array.from({ length: 45 }, (_, i) => ({
        id: `t${i}`, name: `Reminder ${i}`, type: 'EMAIL', subject: 's', purpose: 'X', active: true, body: '',
      }));
      const { service, http } = makeService({ '/templates': templates });

      let first: any;
      let third: any;
      service.searchType('reminder', 'template', 0).subscribe(r => (first = r));
      service.searchType('reminder', 'template', 2).subscribe(r => (third = r));

      expect(first.results).toHaveLength(20);
      expect(third.results.map((r: any) => r.id)).toEqual(['t40', 't41', 't42', 't43', 't44']);
      expect(third.total).toBe(45);
      // shared minute cache: one fetch for both pages
      expect(http.get.mock.calls.filter(c => String(c[0]).includes('/templates'))).toHaveLength(1);
    });

    it('searchType passes a custom page size to text endpoints, payments and in-memory paging', () => {
      const templates = Array.from({ length: 25 }, (_, i) => ({
        id: `t${i}`, name: `Reminder ${i}`, type: 'EMAIL', subject: 's', purpose: 'X', active: true, body: '',
      }));
      const { service, http } = makeService({ '/templates': templates });

      service.searchType('user', 'user', 1, 50).subscribe();
      service.searchType('ORD', 'payment', 0, 10).subscribe();
      let inMemory: any;
      service.searchType('reminder', 'template', 1, 10).subscribe(r => (inMemory = r));

      expect(http.post).toHaveBeenCalledWith(expect.stringContaining('/users/filter'), { searchText: 'user', page: 1, size: 50 }, undefined, expect.anything());
      const payment = http.get.mock.calls.find(c => String(c[0]).endsWith('/payments'))!;
      expect(payment[2].get('size')).toBe('10');
      expect(inMemory.results.map((r: any) => r.id)).toEqual(Array.from({ length: 10 }, (_, i) => `t${10 + i}`));
      expect(inMemory.total).toBe(25);
    });
  });
});
