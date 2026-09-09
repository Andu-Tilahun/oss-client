import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { FormBuilder } from '@angular/forms';
import { FarmPlotCreateWizardComponent } from './farm-plot-create-wizard.component';
import { Region } from '../../../regions/models/region.model';

function fakeFile(name: string, type: string, size: number): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function fileSelectEvent(file: File | null): Event {
  const input = document.createElement('input');
  input.type = 'file';
  if (file) {
    Object.defineProperty(input, 'files', { value: [file] });
  }
  return { target: input } as unknown as Event;
}

function makeComponent() {
  const mockFileUploadService = { uploadFile: vi.fn() };
  const mockToastService = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
  const mockRegionService = { filterRegions: vi.fn(() => of({ content: [] as Region[] })) };

  const component = new FarmPlotCreateWizardComponent(
    new FormBuilder(),
    mockFileUploadService as any,
    mockToastService as any,
    mockRegionService as any,
  );

  return { component, mockFileUploadService, mockToastService, mockRegionService };
}

describe('FarmPlotCreateWizardComponent', () => {
  let component: FarmPlotCreateWizardComponent;
  let mockFileUploadService: ReturnType<typeof makeComponent>['mockFileUploadService'];
  let mockToastService: ReturnType<typeof makeComponent>['mockToastService'];
  let mockRegionService: ReturnType<typeof makeComponent>['mockRegionService'];

  beforeEach(() => {
    ({ component, mockFileUploadService, mockToastService, mockRegionService } = makeComponent());
  });

  it('should create', () => expect(component).toBeTruthy());

  describe('ngOnInit', () => {
    it('loads regions', () => {
      const regions: Region[] = [{ id: 'r1', name: 'North' }];
      mockRegionService.filterRegions.mockReturnValue(of({ content: regions }));

      component.ngOnInit();

      expect(component.regions).toEqual(regions);
      expect(component.regionsLoading).toBe(false);
    });

    it('stops the loading flag when the request fails', () => {
      mockRegionService.filterRegions.mockReturnValue(throwError(() => new Error('boom')));

      component.ngOnInit();

      expect(component.regionsLoading).toBe(false);
    });
  });

  describe('isStepValid', () => {
    it('step 1 is invalid until title/size/sizeType are filled', () => {
      expect(component.isStepValid(1)).toBe(false);
      component.basicInfoForm.patchValue({ title: 'North Field', size: 10, sizeType: 'ACRES' });
      expect(component.isStepValid(1)).toBe(true);
    });

    it('step 2 is invalid until coordinates/soilType/regionId are filled', () => {
      expect(component.isStepValid(2)).toBe(false);
      component.locationForm.patchValue({
        coordinates: { latitude: 9.03, longitude: 38.74 },
        soilType: 'LOAMY',
        regionId: 'r1',
      });
      expect(component.isStepValid(2)).toBe(true);
    });

    it('step 3 reflects whether a plot image is pending', () => {
      expect(component.isStepValid(3)).toBe(false);
      component.mainImageUpload = { hasPendingUpload: () => true } as any;
      expect(component.isStepValid(3)).toBe(true);
    });
  });

  describe('markStepTouched', () => {
    it('marks step 1 controls as touched', () => {
      component.markStepTouched(1);
      expect(component.basicInfoForm.get('title')?.touched).toBe(true);
      expect(component.basicInfoForm.get('size')?.touched).toBe(true);
    });

    it('shows a toast when step 3 has no pending image', () => {
      component.markStepTouched(3);
      expect(mockToastService.error).toHaveBeenCalledWith('Please select a plot image', 'Create Farm Plot');
    });

    it('does not show a toast for step 3 once an image is pending', () => {
      component.mainImageUpload = { hasPendingUpload: () => true } as any;
      component.markStepTouched(3);
      expect(mockToastService.error).not.toHaveBeenCalled();
    });
  });

  describe('getValue', () => {
    it('flattens coordinates into latitude/longitude and locks status to ACTIVE', () => {
      component.basicInfoForm.patchValue({ title: 'North Field', description: 'desc', size: 10, sizeType: 'ACRES' });
      component.locationForm.patchValue({
        coordinates: { latitude: 9.03, longitude: 38.74 },
        soilType: 'LOAMY',
        regionId: 'r1',
      });

      expect(component.getValue()).toEqual({
        title: 'North Field',
        description: 'desc',
        size: 10,
        sizeType: 'ACRES',
        latitude: 9.03,
        longitude: 38.74,
        soilType: 'LOAMY',
        status: 'ACTIVE',
        regionId: 'r1',
      });
    });
  });

  describe('previewData', () => {
    it('reflects live form values as they change', () => {
      component.regions = [{ id: 'r1', name: 'North Region' }];
      component.basicInfoForm.patchValue({ title: 'North Field', size: 10, sizeType: 'ACRES' });
      component.locationForm.patchValue({
        coordinates: { latitude: 9.03, longitude: 38.74 },
        soilType: 'LOAMY',
        regionId: 'r1',
      });

      const preview = component.previewData;

      expect(preview.title).toBe('North Field');
      expect(preview.size).toBe(10);
      expect(preview.sizeType).toBe('ACRES');
      expect(preview.latitude).toBe(9.03);
      expect(preview.longitude).toBe(38.74);
      expect(preview.soilType).toBe('LOAMY');
      expect(preview.status).toBe('ACTIVE');
      expect(preview.regionName).toBe('North Region');
    });

    it('has no region name when nothing matches the selected id', () => {
      component.regions = [];
      expect(component.previewData.regionName).toBeUndefined();
    });
  });

  describe('reset', () => {
    it('clears both form groups, gallery images, and any pending main image', () => {
      component.basicInfoForm.patchValue({ title: 'North Field' });
      component.locationForm.patchValue({ soilType: 'LOAMY' });
      component.galleryImages = [{ id: 'g1', previewUrl: 'url' }];
      const removeImage = vi.fn();
      component.mainImageUpload = { hasPendingUpload: () => true, removeImage } as any;

      component.reset();

      expect(component.basicInfoForm.get('title')?.value).toBeFalsy();
      expect(component.locationForm.get('soilType')?.value).toBeFalsy();
      expect(component.galleryImages).toEqual([]);
      expect(removeImage).toHaveBeenCalled();
    });
  });

  describe('gallery upload', () => {
    it('rejects a non-image file', () => {
      const file = fakeFile('doc.pdf', 'application/pdf', 1024);
      component.onGalleryFileSelected(fileSelectEvent(file));

      expect(mockToastService.error).toHaveBeenCalledWith('Please select an image file', 'Gallery');
      expect(mockFileUploadService.uploadFile).not.toHaveBeenCalled();
    });

    it('rejects a file over 10MB', () => {
      const bigFile = fakeFile('big.png', 'image/png', 11 * 1024 * 1024);
      component.onGalleryFileSelected(fileSelectEvent(bigFile));

      expect(mockToastService.error).toHaveBeenCalledWith('File size must be less than 10MB', 'Gallery');
      expect(mockFileUploadService.uploadFile).not.toHaveBeenCalled();
    });

    it('uploads a valid image and appends it to galleryImages', () => {
      const file = fakeFile('plot.png', 'image/png', 1024);
      mockFileUploadService.uploadFile.mockReturnValue(
        of({ progress: 100, file: { id: 'g1', presignedUrl: 'https://files/g1' } }),
      );

      component.onGalleryFileSelected(fileSelectEvent(file));

      expect(component.galleryImages).toEqual([{ id: 'g1', previewUrl: 'https://files/g1' }]);
      expect(component.galleryUploading).toBe(false);
    });

    it('removes a gallery slot by index', () => {
      component.galleryImages = [
        { id: 'g1', previewUrl: 'url1' },
        { id: 'g2', previewUrl: 'url2' },
      ];

      component.removeGallerySlot(0);

      expect(component.galleryImages).toEqual([{ id: 'g2', previewUrl: 'url2' }]);
    });
  });
});
