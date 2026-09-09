import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { FormBuilder } from '@angular/forms';
import { FarmPlotEditWizardComponent } from './farm-plot-edit-wizard.component';
import { FarmPlot, FarmPlotStatus } from '../../models/farm-plot.model';
import { Region } from '../../../regions/models/region.model';

function mockPlot(overrides: Partial<FarmPlot>): FarmPlot {
  return {
    id: 'plot-1',
    title: 'North Field',
    description: 'desc',
    size: 10,
    sizeType: 'ACRES',
    latitude: 9.03,
    longitude: 38.74,
    soilType: 'LOAMY',
    status: 'ACTIVE',
    imageUuid: 'img-1',
    regionId: 'r1',
    gallery: [],
    ...overrides,
  };
}

function makeComponent() {
  const mockFileUploadService = { uploadFile: vi.fn(), getFileMetadata: vi.fn(), getFileUrl: vi.fn((id: string) => `url/${id}`) };
  const mockToastService = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
  const mockRegionService = { filterRegions: vi.fn(() => of({ content: [] as Region[] })) };

  const component = new FarmPlotEditWizardComponent(
    new FormBuilder(),
    mockFileUploadService as any,
    mockToastService as any,
    mockRegionService as any,
  );

  return { component, mockFileUploadService, mockToastService, mockRegionService };
}

describe('FarmPlotEditWizardComponent', () => {
  let component: FarmPlotEditWizardComponent;
  let mockFileUploadService: ReturnType<typeof makeComponent>['mockFileUploadService'];
  let mockToastService: ReturnType<typeof makeComponent>['mockToastService'];
  let mockRegionService: ReturnType<typeof makeComponent>['mockRegionService'];

  beforeEach(() => {
    ({ component, mockFileUploadService, mockToastService, mockRegionService } = makeComponent());
  });

  it('should create', () => expect(component).toBeTruthy());

  describe('pre-population from farmPlot', () => {
    it('patches both form groups and the image uuid on init', () => {
      component.farmPlot = mockPlot({});
      component.ngOnChanges({ farmPlot: { firstChange: true } as any });

      expect(component.basicInfoForm.value.title).toBe('North Field');
      expect(component.basicInfoForm.value.size).toBe(10);
      expect(component.locationForm.value.coordinates).toEqual({ latitude: 9.03, longitude: 38.74 });
      expect(component.locationForm.value.soilType).toBe('LOAMY');
      expect(component.locationForm.value.regionId).toBe('r1');
      expect(component.locationForm.value.status).toBe('ACTIVE');
      expect(component.imageUuid).toBe('img-1');
    });

    it('fetches gallery image metadata for existing gallery items', () => {
      mockFileUploadService.getFileMetadata.mockReturnValue(of({ id: 'g1', presignedUrl: 'https://files/g1' } as any));
      component.farmPlot = mockPlot({ gallery: [{ id: 'gal-1', imageUuid: 'g1', sortOrder: 0 }] });

      component.ngOnChanges({ farmPlot: { firstChange: true } as any });

      expect(mockFileUploadService.getFileMetadata).toHaveBeenCalledWith('g1');
      expect(component.galleryImages).toEqual([{ id: 'g1', previewUrl: 'https://files/g1' }]);
    });

    it('re-syncs when farmPlot input changes to a different plot', () => {
      component.farmPlot = mockPlot({ title: 'First Plot' });
      component.ngOnChanges({ farmPlot: { firstChange: true } as any });
      expect(component.basicInfoForm.value.title).toBe('First Plot');

      component.farmPlot = mockPlot({ title: 'Second Plot', status: 'INACTIVE' });
      component.ngOnChanges({ farmPlot: { firstChange: false } as any });

      expect(component.basicInfoForm.value.title).toBe('Second Plot');
      expect(component.locationForm.value.status).toBe('INACTIVE');
    });
  });

  describe('isStatusEditable', () => {
    const editableCases: FarmPlotStatus[] = ['ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE'];
    const lockedCases: FarmPlotStatus[] = [
      'ASSIGNED_TO_LEASE', 'ASSIGNED_TO_BIDDING', 'ASSIGNED_TO_CROWDFUNDING',
      'ASSIGNED_TO_INVESTMENT_PACKAGE', 'ASSIGNED',
    ];

    it.each(editableCases)('is editable when current status is %s', (status) => {
      component.farmPlot = mockPlot({ status });
      expect(component.isStatusEditable).toBe(true);
    });

    it.each(lockedCases)('is locked when current status is %s', (status) => {
      component.farmPlot = mockPlot({ status });
      expect(component.isStatusEditable).toBe(false);
    });
  });

  describe('previewData', () => {
    it('reflects live edits and resolves the region name', () => {
      component.farmPlot = mockPlot({});
      component.ngOnChanges({ farmPlot: { firstChange: true } as any });
      component.regions = [{ id: 'r1', name: 'North Region' }];
      component.basicInfoForm.patchValue({ title: 'Updated Title' });

      const preview = component.previewData;

      expect(preview.title).toBe('Updated Title');
      expect(preview.status).toBe('ACTIVE');
      expect(preview.regionName).toBe('North Region');
    });
  });

  describe('getValue', () => {
    it('includes the current status alongside the other fields', () => {
      component.farmPlot = mockPlot({ status: 'UNDER_MAINTENANCE' });
      component.ngOnChanges({ farmPlot: { firstChange: true } as any });

      const value = component.getValue();

      expect(value.status).toBe('UNDER_MAINTENANCE');
      expect(value.imageUuid).toBe('img-1');
      expect(value.title).toBe('North Field');
    });

    it('carries a locked system-managed status through unchanged', () => {
      component.farmPlot = mockPlot({ status: 'ASSIGNED_TO_LEASE' });
      component.ngOnChanges({ farmPlot: { firstChange: true } as any });

      expect(component.isStatusEditable).toBe(false);
      expect(component.getValue().status).toBe('ASSIGNED_TO_LEASE');
    });
  });

  describe('reset', () => {
    it('reverts in-progress edits back to the loaded farmPlot values', () => {
      component.farmPlot = mockPlot({});
      component.ngOnChanges({ farmPlot: { firstChange: true } as any });
      component.basicInfoForm.patchValue({ title: 'Unsaved edit' });

      component.reset();

      expect(component.basicInfoForm.value.title).toBe('North Field');
    });
  });
});
