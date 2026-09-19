import { describe, it, expect } from 'vitest';
import { SocialMediaFilterComponent } from './social-media-filter.component';

describe('SocialMediaFilterComponent', () => {
  it('emits searchTextChange when the search text updates', () => {
    const component = new SocialMediaFilterComponent();
    const emitted: string[] = [];
    component.searchTextChange.subscribe((v) => emitted.push(v));

    component.onSearchTextInput('facebook.com');

    expect(emitted).toEqual(['facebook.com']);
  });

  it('emits selectedPlatformChange and filterChange when platform changes', () => {
    const component = new SocialMediaFilterComponent();
    const platformEmitted: string[] = [];
    let filterChangeCalled = false;
    component.selectedPlatformChange.subscribe((v) => platformEmitted.push(v));
    component.filterChange.subscribe(() => (filterChangeCalled = true));

    component.onPlatformChange('INSTAGRAM');

    expect(platformEmitted).toEqual(['INSTAGRAM']);
    expect(filterChangeCalled).toBe(true);
  });

  it('onClearFilters resets search text and platform, then emits clearFilters', () => {
    const component = new SocialMediaFilterComponent();
    const searchEmitted: string[] = [];
    const platformEmitted: string[] = [];
    let clearCalled = false;
    component.searchTextChange.subscribe((v) => searchEmitted.push(v));
    component.selectedPlatformChange.subscribe((v) => platformEmitted.push(v));
    component.clearFilters.subscribe(() => (clearCalled = true));

    component.onClearFilters();

    expect(searchEmitted).toEqual(['']);
    expect(platformEmitted).toEqual(['']);
    expect(clearCalled).toBe(true);
  });
});
