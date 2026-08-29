import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { SocialMediaPageComponent } from './social-media-page.component';
import { SocialMediaLink } from '../../models/social-media.model';

const VISIBLE_LINK: SocialMediaLink = {
  id: 'social-uuid-1',
  platform: 'FACEBOOK',
  url: 'https://facebook.com/example',
  visible: true,
  displayOrder: 0,
};

const HIDDEN_LINK: SocialMediaLink = {
  id: 'social-uuid-2',
  platform: 'INSTAGRAM',
  url: 'https://instagram.com/example',
  visible: false,
  displayOrder: 1,
};

function mockPage(content: SocialMediaLink[]) {
  return { content, totalElements: content.length, totalPages: 1, number: 0, size: content.length || 10, first: true, last: true };
}

function makeComponent() {
  const mockService = {
    filterSocialMedia: vi.fn(() => of(mockPage([VISIBLE_LINK, HIDDEN_LINK]))),
    createSocialMedia: vi.fn(() => of({ success: true, data: VISIBLE_LINK })),
    updateSocialMedia: vi.fn(() => of({ success: true, data: VISIBLE_LINK })),
    deleteSocialMedia: vi.fn(() => of({ success: true })),
  };
  const mockToastService = { success: vi.fn(), error: vi.fn() };
  const component = new SocialMediaPageComponent(new FormBuilder(), mockService as any, mockToastService as any);
  component.ngOnInit();
  return { component, mockService };
}

describe('SocialMediaPageComponent', () => {
  let component: SocialMediaPageComponent;
  let mockService: ReturnType<typeof makeComponent>['mockService'];

  beforeEach(() => {
    ({ component, mockService } = makeComponent());
  });

  it('should create', () => expect(component).toBeTruthy());

  it('calls filterSocialMedia on init with default paging', () => {
    expect(mockService.filterSocialMedia).toHaveBeenCalledWith(expect.objectContaining({ page: 0, size: 10 }));
  });

  it('populates links and auto-selects the first one', () => {
    expect(component.links).toHaveLength(2);
    expect(component.selectedLink?.id).toBe('social-uuid-1');
  });

  it('sets loading=false on load failure', () => {
    mockService.filterSocialMedia.mockReturnValue(throwError(() => new Error('fail')));
    component.loadLinks();
    expect(component.loading).toBe(false);
  });

  it('openEdit patches the form from the link', () => {
    component.openEdit(VISIBLE_LINK);
    expect(component.editingId).toBe('social-uuid-1');
    expect(component.form.get('platform')?.value).toBe('FACEBOOK');
    expect(component.form.get('url')?.value).toBe('https://facebook.com/example');
  });

  it('onSave calls updateSocialMedia when editingId is set', () => {
    component.openEdit(VISIBLE_LINK);
    component.form.patchValue({ url: 'https://facebook.com/updated' });
    component.onSave();
    expect(mockService.updateSocialMedia).toHaveBeenCalledWith(
      'social-uuid-1', expect.objectContaining({ url: 'https://facebook.com/updated' }),
    );
  });

  it('onDelete calls deleteSocialMedia after confirm', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.onDelete('social-uuid-1');
    expect(mockService.deleteSocialMedia).toHaveBeenCalledWith('social-uuid-1');
  });

  describe('search, filter and pagination', () => {
    it('onPageChange updates paging state and reloads', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 20 });
      expect(component.pageIndex).toBe(2);
      expect(mockService.filterSocialMedia).toHaveBeenCalledWith(expect.objectContaining({ page: 1, size: 20 }));
    });

    it('onSearch resets to page 1 and includes searchText', () => {
      component.pageIndex = 3;
      component.searchText = 'facebook';
      component.onSearch();
      expect(component.pageIndex).toBe(1);
      expect(mockService.filterSocialMedia).toHaveBeenCalledWith(expect.objectContaining({ searchText: 'facebook', page: 0 }));
    });

    it('onFilterChange includes the selected platform', () => {
      component.selectedPlatform = 'INSTAGRAM';
      component.onFilterChange();
      expect(mockService.filterSocialMedia).toHaveBeenCalledWith(expect.objectContaining({ platform: 'INSTAGRAM' }));
    });

    it('clearFilters reloads from page 1', () => {
      component.pageIndex = 2;
      component.clearFilters();
      expect(component.pageIndex).toBe(1);
      expect(mockService.filterSocialMedia).toHaveBeenCalled();
    });
  });

  describe('table columns config', () => {
    it('Visible checkbox column reflects the link visibility per row', () => {
      const visibleColumn = component.columns.find(c => c.header === 'Visible')!;
      const defaultValue = visibleColumn.defaultValue as (item: SocialMediaLink) => boolean;
      expect(defaultValue(VISIBLE_LINK)).toBe(true);
      expect(defaultValue(HIDDEN_LINK)).toBe(false);
    });

    it('Visible checkbox column calls toggleVisible on change', () => {
      // Stub out the implementation: toggleVisible mutates its argument in place,
      // and we only care here that the column wiring calls it, not its internal effects.
      const toggleSpy = vi.spyOn(component, 'toggleVisible').mockImplementation(() => undefined);
      const visibleColumn = component.columns.find(c => c.header === 'Visible')!;
      visibleColumn.columnAction!(VISIBLE_LINK);
      expect(toggleSpy).toHaveBeenCalledWith(VISIBLE_LINK);
    });

    it('toggleVisible flips visibility via updateSocialMedia', () => {
      // toggleVisible mutates the passed object in place, so use a fresh copy to avoid cross-test leakage.
      const link = { ...VISIBLE_LINK };
      component.toggleVisible(link);
      expect(mockService.updateSocialMedia).toHaveBeenCalledWith(
        'social-uuid-1', expect.objectContaining({ visible: false }),
      );
    });

    it('Visible column is disabled while that link is toggling', () => {
      component.togglingId = 'social-uuid-1';
      const visibleColumn = component.columns.find(c => c.header === 'Visible')!;
      const disabled = visibleColumn.disabled as (item: SocialMediaLink) => boolean;
      expect(disabled(VISIBLE_LINK)).toBe(true);
      expect(disabled(HIDDEN_LINK)).toBe(false);
    });

    it('rowActions edit/delete call the right handlers', () => {
      const editAction = component.rowActions.find(a => a.id === 'edit')!;
      const openEditSpy = vi.spyOn(component, 'openEdit');
      editAction.action(VISIBLE_LINK);
      expect(openEditSpy).toHaveBeenCalledWith(VISIBLE_LINK);
    });
  });
});
