import { describe, it, expect } from 'vitest';
import { deepLinkParam$ } from './deep-link.util';
import { mockRouteWithQueryParams } from './deep-link.testing';

describe('deepLinkParam$', () => {
  it('emits the id present at subscription time', () => {
    const { route } = mockRouteWithQueryParams({ id: 'abc' });
    const seen: string[] = [];

    deepLinkParam$(route as any).subscribe(id => seen.push(id));

    expect(seen).toEqual(['abc']);
  });

  it('does not emit when there is no id', () => {
    const { route } = mockRouteWithQueryParams({ tab: 'archived' });
    const seen: string[] = [];

    deepLinkParam$(route as any).subscribe(id => seen.push(id));

    expect(seen).toEqual([]);
  });

  it('emits again when the id changes on an already-open page, but not for the same id', () => {
    const { route, setQueryParams } = mockRouteWithQueryParams();
    const seen: string[] = [];
    deepLinkParam$(route as any).subscribe(id => seen.push(id));

    setQueryParams({ id: 'a' });
    setQueryParams({ id: 'a', panel: 'contract' });
    setQueryParams({ id: 'b' });

    expect(seen).toEqual(['a', 'b']);
  });

  it('can read a differently named param', () => {
    const { route } = mockRouteWithQueryParams({ packageId: 'p1' });
    const seen: string[] = [];

    deepLinkParam$(route as any, 'packageId').subscribe(id => seen.push(id));

    expect(seen).toEqual(['p1']);
  });
});
