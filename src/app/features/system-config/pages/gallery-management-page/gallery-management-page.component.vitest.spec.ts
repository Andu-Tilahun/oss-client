import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { GalleryManagementPageComponent } from './gallery-management-page.component';
import { GalleryItem } from '../../models/gallery-item.model';

const MOCK_ITEM: GalleryItem = {
  id: 'gallery-uuid-1',
  title: 'Harvest season',
  description: 'Harvest description',
  mediaUuid: 'media-uuid-1',
  kind: 'IMAGE',
  visible: true,
  displayOrder: 0,
};

const VIDEO_ITEM: GalleryItem = {
  id: 'gallery-uuid-2',
  title: 'Irrigation clip',
  description: 'Irrigation description',
  mediaUuid: 'media-uuid-2',
  kind: 'VIDEO',
  visible: false,
  displayOrder: 1,
};

function mockPage(content: GalleryItem[]) {
  return { content, totalElements: content.length, totalPages: 1, number: 0, size: content.length || 10, first: true, last: true };
}

function makeComponent() {
  const mockService = {
    filterGalleryItems: vi.fn(() => of(mockPage([MOCK_ITEM]))),
    createGalleryItem: vi.fn(() => of({ success: true, data: MOCK_ITEM })),
    updateGalleryItem: vi.fn(() => of({ success: true, data: MOCK_ITEM })),
    deleteGalleryItem: vi.fn(() => of({ success: true })),
  };
  const mockToastService = { success: vi.fn(), error: vi.fn() };
  const component = new GalleryManagementPageComponent(new FormBuilder(), mockService as any, mockToastService as any);
  component.ngOnInit();
  return { component, mockService, mockToastService };
}

describe('GalleryManagementPageComponent', () => {
  let component: GalleryManagementPageComponent;
  let mockService: ReturnType<typeof makeComponent>['mockService'];

  beforeEach(() => {
    ({ component, mockService } = makeComponent());
  });

  it('should create', () => expect(component).toBeTruthy());

  it('calls filterGalleryItems on init with default paging', () => {
    expect(mockService.filterGalleryItems).toHaveBeenCalledWith(expect.objectContaining({ page: 0, size: 10 }));
  });

  it('populates items and auto-selects the first one', () => {
    expect(component.items).toHaveLength(1);
    expect(component.selectedItem?.id).toBe('gallery-uuid-1');
  });

  it('sets loading=false on load failure', () => {
    mockService.filterGalleryItems.mockReturnValue(throwError(() => new Error('fail')));
    component.loadItems();
    expect(component.loading).toBe(false);
  });

  it('openCreate resets the form and clears editingId', () => {
    component.editingId = 'x';
    component.openCreate();
    expect(component.showModal).toBe(true);
    expect(component.editingId).toBeNull();
    expect(component.form.get('visible')?.value).toBe(true);
  });

  it('openEdit patches the form including mediaUuid and kind', () => {
    component.openEdit(MOCK_ITEM);
    expect(component.editingId).toBe('gallery-uuid-1');
    expect(component.form.get('title')?.value).toBe('Harvest season');
    expect(component.form.get('mediaUuid')?.value).toBe('media-uuid-1');
    expect(component.form.get('kind')?.value).toBe('IMAGE');
  });

  it('onMediaSelected patches mediaUuid and kind from the picker', () => {
    component.onMediaSelected({ id: 'new-media-uuid', kind: 'VIDEO', previewUrl: 'http://x/y' });
    expect(component.form.get('mediaUuid')?.value).toBe('new-media-uuid');
    expect(component.form.get('kind')?.value).toBe('VIDEO');
  });

  it('onSave does NOT call service when form is invalid (no media selected)', () => {
    component.openCreate();
    component.form.patchValue({ title: 'New title', description: 'New description' });
    component.onSave();
    expect(mockService.createGalleryItem).not.toHaveBeenCalled();
  });

  it('onSave calls createGalleryItem with the full payload when creating', () => {
    component.openCreate();
    component.form.patchValue({ title: 'New title', description: 'New description' });
    component.onMediaSelected({ id: 'media-uuid-2', kind: 'IMAGE', previewUrl: 'http://x/y' });
    component.onSave();
    expect(mockService.createGalleryItem).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'New title', mediaUuid: 'media-uuid-2', kind: 'IMAGE', visible: true }),
    );
  });

  it('onSave calls updateGalleryItem when editingId is set', () => {
    component.openEdit(MOCK_ITEM);
    component.form.patchValue({ title: 'Updated title' });
    component.onSave();
    expect(mockService.updateGalleryItem).toHaveBeenCalledWith(
      'gallery-uuid-1',
      expect.objectContaining({ title: 'Updated title' }),
    );
  });

  it('onDelete calls deleteGalleryItem after confirm', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.onDelete('gallery-uuid-1');
    expect(mockService.deleteGalleryItem).toHaveBeenCalledWith('gallery-uuid-1');
  });

  it('onDelete does NOT call service when confirm is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.onDelete('gallery-uuid-1');
    expect(mockService.deleteGalleryItem).not.toHaveBeenCalled();
  });

  it('onDelete removes the item from the list and clears selection', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.selectedItem = MOCK_ITEM;
    component.onDelete('gallery-uuid-1');
    expect(component.items).toHaveLength(0);
    expect(component.selectedItem).toBeNull();
  });

  describe('search, filter and pagination', () => {
    it('onPageChange updates paging state and reloads', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 20 });
      expect(component.pageIndex).toBe(2);
      expect(mockService.filterGalleryItems).toHaveBeenCalledWith(expect.objectContaining({ page: 1, size: 20 }));
    });

    it('onSearch resets to page 1 and includes searchText', () => {
      component.pageIndex = 3;
      component.searchText = 'harvest';
      component.onSearch();
      expect(component.pageIndex).toBe(1);
      expect(mockService.filterGalleryItems).toHaveBeenCalledWith(expect.objectContaining({ searchText: 'harvest', page: 0 }));
    });

    it('onFilterChange includes the selected kind', () => {
      component.selectedKind = 'VIDEO';
      component.onFilterChange();
      expect(mockService.filterGalleryItems).toHaveBeenCalledWith(expect.objectContaining({ kind: 'VIDEO' }));
    });

    it('clearFilters reloads from page 1', () => {
      component.pageIndex = 2;
      component.clearFilters();
      expect(component.pageIndex).toBe(1);
      expect(mockService.filterGalleryItems).toHaveBeenCalled();
    });
  });

  describe('table columns config', () => {
    it('Media column mediaKind resolves image vs video per item', () => {
      const mediaColumn = component.columns.find(c => c.header === 'Media')!;
      expect(mediaColumn.mediaKind!(MOCK_ITEM)).toBe('image');
      expect(mediaColumn.mediaKind!(VIDEO_ITEM)).toBe('video');
    });

    it('Media column value resolves the storage URL for the item', () => {
      const mediaColumn = component.columns.find(c => c.header === 'Media')!;
      expect(mediaColumn.value!(MOCK_ITEM)).toBe(component.mediaUrl(MOCK_ITEM));
    });

    it('Visible column shows a green pill for visible items and gray for hidden', () => {
      const visibleColumn = component.columns.find(c => c.header === 'Visible')!;
      const cellClass = visibleColumn.cellClass as (item: GalleryItem) => string;
      expect(visibleColumn.value!(MOCK_ITEM)).toBe('Visible');
      expect(cellClass(MOCK_ITEM)).toContain('bg-green-100');
      expect(visibleColumn.value!(VIDEO_ITEM)).toBe('Hidden');
      expect(cellClass(VIDEO_ITEM)).toContain('bg-gray-100');
    });

    it('rowActions edit/delete call the right handlers', () => {
      const editAction = component.rowActions.find(a => a.id === 'edit')!;
      const openEditSpy = vi.spyOn(component, 'openEdit');
      editAction.action(MOCK_ITEM);
      expect(openEditSpy).toHaveBeenCalledWith(MOCK_ITEM);
    });
  });
});
