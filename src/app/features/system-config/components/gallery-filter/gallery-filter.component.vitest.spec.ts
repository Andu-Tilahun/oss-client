import { describe, it, expect } from 'vitest';
import { GalleryFilterComponent } from './gallery-filter.component';

describe('GalleryFilterComponent', () => {
  it('emits searchTextChange when the search text updates', () => {
    const component = new GalleryFilterComponent();
    const emitted: string[] = [];
    component.searchTextChange.subscribe((v) => emitted.push(v));

    component.onSearchTextInput('harvest');

    expect(emitted).toEqual(['harvest']);
  });

  it('emits selectedKindChange and filterChange when kind changes', () => {
    const component = new GalleryFilterComponent();
    const kindEmitted: string[] = [];
    let filterChangeCalled = false;
    component.selectedKindChange.subscribe((v) => kindEmitted.push(v));
    component.filterChange.subscribe(() => (filterChangeCalled = true));

    component.onKindChange('VIDEO');

    expect(kindEmitted).toEqual(['VIDEO']);
    expect(filterChangeCalled).toBe(true);
  });

  it('onClearFilters resets search text and kind, then emits clearFilters', () => {
    const component = new GalleryFilterComponent();
    const searchEmitted: string[] = [];
    const kindEmitted: string[] = [];
    let clearCalled = false;
    component.searchTextChange.subscribe((v) => searchEmitted.push(v));
    component.selectedKindChange.subscribe((v) => kindEmitted.push(v));
    component.clearFilters.subscribe(() => (clearCalled = true));

    component.onClearFilters();

    expect(searchEmitted).toEqual(['']);
    expect(kindEmitted).toEqual(['']);
    expect(clearCalled).toBe(true);
  });
});
