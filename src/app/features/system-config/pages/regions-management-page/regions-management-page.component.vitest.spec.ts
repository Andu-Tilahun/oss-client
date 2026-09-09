import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { RegionsManagementPageComponent } from './regions-management-page.component';
import { Region } from '../../../regions/models/region.model';

const REGION_A: Region = { id: 'region-uuid-1', name: 'Oromia' };
const REGION_B: Region = { id: 'region-uuid-2', name: 'Amhara' };

function mockPage(content: Region[]) {
  return { content, totalElements: content.length, totalPages: 1, number: 0, size: content.length || 10 };
}

function makeComponent() {
  const mockRegionService = {
    filterRegions: vi.fn(() => of(mockPage([REGION_A, REGION_B]))),
    createRegion: vi.fn(() => of({ success: true, data: REGION_A })),
    updateRegion: vi.fn(() => of({ success: true, data: REGION_A })),
    deleteRegion: vi.fn(() => of({ success: true })),
  };
  const mockToastService = { success: vi.fn(), error: vi.fn() };
  const component = new RegionsManagementPageComponent(new FormBuilder(), mockRegionService as any, mockToastService as any);
  component.ngOnInit();
  return { component, mockRegionService };
}

describe('RegionsManagementPageComponent', () => {
  let component: RegionsManagementPageComponent;
  let mockRegionService: ReturnType<typeof makeComponent>['mockRegionService'];

  beforeEach(() => {
    ({ component, mockRegionService } = makeComponent());
  });

  it('should create', () => expect(component).toBeTruthy());

  it('calls filterRegions on init with default paging', () => {
    expect(mockRegionService.filterRegions).toHaveBeenCalledWith(expect.objectContaining({ page: 0, size: 10 }));
  });

  it('populates regions and auto-selects the first one', () => {
    expect(component.regions).toHaveLength(2);
    expect(component.selectedRegion?.id).toBe('region-uuid-1');
  });

  it('sets loading=false on load failure', () => {
    mockRegionService.filterRegions.mockReturnValue(throwError(() => new Error('fail')));
    component.loadRegions();
    expect(component.loading).toBe(false);
  });

  it('openCreate resets the form and clears editingId', () => {
    component.editingId = 'x';
    component.openCreate();
    expect(component.showModal).toBe(true);
    expect(component.editingId).toBeNull();
  });

  it('openEdit patches the form from the region', () => {
    component.openEdit(REGION_A);
    expect(component.editingId).toBe('region-uuid-1');
    expect(component.form.get('name')?.value).toBe('Oromia');
  });

  it('onSave does NOT call service when form is invalid', () => {
    component.openCreate();
    component.onSave();
    expect(mockRegionService.createRegion).not.toHaveBeenCalled();
  });

  it('onSave calls createRegion when creating', () => {
    component.openCreate();
    component.form.patchValue({ name: 'Tigray' });
    component.onSave();
    expect(mockRegionService.createRegion).toHaveBeenCalledWith(expect.objectContaining({ name: 'Tigray' }));
  });

  it('onSave calls updateRegion when editingId is set', () => {
    component.openEdit(REGION_A);
    component.form.patchValue({ name: 'Updated name' });
    component.onSave();
    expect(mockRegionService.updateRegion).toHaveBeenCalledWith('region-uuid-1', expect.objectContaining({ name: 'Updated name' }));
  });

  it('onDelete calls deleteRegion after confirm', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.onDelete('region-uuid-1');
    expect(mockRegionService.deleteRegion).toHaveBeenCalledWith('region-uuid-1');
  });

  it('onDelete removes the region from the list and clears selection', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.selectedRegion = REGION_A;
    component.onDelete('region-uuid-1');
    expect(component.regions).toHaveLength(1);
    expect(component.selectedRegion).toBeNull();
  });

  describe('search and pagination', () => {
    it('onPageChange updates paging state and reloads', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 20 });
      expect(component.pageIndex).toBe(2);
      expect(mockRegionService.filterRegions).toHaveBeenCalledWith(expect.objectContaining({ page: 1, size: 20 }));
    });

    it('onSearch resets to page 1 and includes searchText', () => {
      component.pageIndex = 3;
      component.searchText = 'Oromia';
      component.onSearch();
      expect(component.pageIndex).toBe(1);
      expect(mockRegionService.filterRegions).toHaveBeenCalledWith(expect.objectContaining({ searchText: 'Oromia', page: 0 }));
    });

    it('clearFilters resets searchText and reloads from page 1', () => {
      component.pageIndex = 2;
      component.searchText = 'Oromia';
      component.clearFilters();
      expect(component.pageIndex).toBe(1);
      expect(component.searchText).toBe('');
      expect(mockRegionService.filterRegions).toHaveBeenCalledWith(expect.objectContaining({ searchText: undefined }));
    });
  });

  describe('table columns config', () => {
    it('Name column reflects region name', () => {
      const nameColumn = component.columns.find(c => c.header === 'Name')!;
      expect(nameColumn.value!(REGION_A)).toBe('Oromia');
    });

    it('rowActions edit/delete call the right handlers', () => {
      const editAction = component.rowActions.find(a => a.id === 'edit')!;
      const openEditSpy = vi.spyOn(component, 'openEdit');
      editAction.action(REGION_A);
      expect(openEditSpy).toHaveBeenCalledWith(REGION_A);
    });

    it('delete rowAction is disabled while that region is deleting', () => {
      component.deleting = 'region-uuid-1';
      const deleteAction = component.rowActions.find(a => a.id === 'delete')!;
      expect(deleteAction.disabled!(REGION_A)).toBe(true);
      expect(deleteAction.disabled!(REGION_B)).toBe(false);
    });
  });
});
