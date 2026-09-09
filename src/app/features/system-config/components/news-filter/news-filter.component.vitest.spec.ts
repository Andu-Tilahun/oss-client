import { describe, it, expect } from 'vitest';
import { NewsFilterComponent } from './news-filter.component';

describe('NewsFilterComponent', () => {
  it('emits searchTextChange when the search text updates', () => {
    const component = new NewsFilterComponent();
    const emitted: string[] = [];
    component.searchTextChange.subscribe((v) => emitted.push(v));

    component.onSearchTextInput('harvest');

    expect(emitted).toEqual(['harvest']);
  });

  it('emits searchChange on search', () => {
    const component = new NewsFilterComponent();
    let called = false;
    component.searchChange.subscribe(() => (called = true));

    component.onSearch();

    expect(called).toBe(true);
  });

  it('emits selectedStatusChange and filterChange when status changes', () => {
    const component = new NewsFilterComponent();
    const statusEmitted: string[] = [];
    let filterChangeCalled = false;
    component.selectedStatusChange.subscribe((v) => statusEmitted.push(v));
    component.filterChange.subscribe(() => (filterChangeCalled = true));

    component.onStatusChange('PUBLISHED');

    expect(statusEmitted).toEqual(['PUBLISHED']);
    expect(filterChangeCalled).toBe(true);
  });

  it('onClearFilters resets search text and status, then emits clearFilters', () => {
    const component = new NewsFilterComponent();
    const searchEmitted: string[] = [];
    const statusEmitted: string[] = [];
    let clearCalled = false;
    component.searchTextChange.subscribe((v) => searchEmitted.push(v));
    component.selectedStatusChange.subscribe((v) => statusEmitted.push(v));
    component.clearFilters.subscribe(() => (clearCalled = true));

    component.onClearFilters();

    expect(searchEmitted).toEqual(['']);
    expect(statusEmitted).toEqual(['']);
    expect(clearCalled).toBe(true);
  });
});
