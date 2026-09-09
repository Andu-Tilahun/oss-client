import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { FarmPlotEditModalComponent } from './farm-plot-edit-modal.component';
import { FarmPlot } from '../../models/farm-plot.model';

function mockPlot(overrides: Partial<FarmPlot>): FarmPlot {
  return { id: 'plot-1', title: 'North Field', size: 10, sizeType: 'ACRES', soilType: 'LOAMY', ...overrides };
}

function makeComponent() {
  const mockFarmPlotService = {
    updateFarmPlot: vi.fn(),
    getFarmPlotGallery: vi.fn(),
    addFarmPlotGalleryImage: vi.fn(),
    deleteFarmPlotGalleryImage: vi.fn(),
  };
  const mockToastService = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
  const mockWizard = {
    isStepValid: vi.fn(() => true),
    markStepTouched: vi.fn(),
    getValue: vi.fn(() => ({} as any)),
    getGalleryImageUuids: vi.fn(() => [] as string[]),
    reset: vi.fn(),
  };

  const component = new FarmPlotEditModalComponent(mockFarmPlotService as any, mockToastService as any);
  component.wizard = mockWizard as any;
  component.farmPlot = mockPlot({});

  return { component, mockFarmPlotService, mockToastService, mockWizard };
}

describe('FarmPlotEditModalComponent', () => {
  let component: FarmPlotEditModalComponent;
  let mockFarmPlotService: ReturnType<typeof makeComponent>['mockFarmPlotService'];
  let mockToastService: ReturnType<typeof makeComponent>['mockToastService'];
  let mockWizard: ReturnType<typeof makeComponent>['mockWizard'];

  beforeEach(() => {
    ({ component, mockFarmPlotService, mockToastService, mockWizard } = makeComponent());
  });

  it('should create', () => expect(component).toBeTruthy());

  describe('onNext', () => {
    it('advances currentStep when the wizard reports the step valid', () => {
      mockWizard.isStepValid.mockReturnValue(true);
      component.currentStep = 1;
      component.onNext();
      expect(component.currentStep).toBe(2);
    });

    it('does not advance and marks the step touched when invalid', () => {
      mockWizard.isStepValid.mockReturnValue(false);
      component.currentStep = 1;
      component.onNext();
      expect(component.currentStep).toBe(1);
      expect(mockWizard.markStepTouched).toHaveBeenCalledWith(1);
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      mockWizard.isStepValid.mockReturnValue(true);
      component.currentStep = 3;
      component.visible = true;
    });

    it('updates the plot, adds new gallery images, removes deselected ones, resets to step 1, and emits farmPlotUpdated', () => {
      mockWizard.getValue.mockReturnValue({ title: 'Updated Title' } as any);
      mockWizard.getGalleryImageUuids.mockReturnValue(['g1', 'g2']);
      mockFarmPlotService.updateFarmPlot.mockReturnValue(of({ id: 'plot-1' } as any));
      mockFarmPlotService.getFarmPlotGallery.mockReturnValue(of([
        { id: 'gal-old', imageUuid: 'g-old', sortOrder: 0 },
        { id: 'gal-1', imageUuid: 'g1', sortOrder: 1 },
      ] as any));
      mockFarmPlotService.addFarmPlotGalleryImage.mockReturnValue(of({} as any));
      mockFarmPlotService.deleteFarmPlotGalleryImage.mockReturnValue(of(undefined as any));

      const updatedSpy = vi.fn();
      component.farmPlotUpdated.subscribe(updatedSpy);
      const visibleChangeSpy = vi.fn();
      component.visibleChange.subscribe(visibleChangeSpy);

      component.onSubmit();

      expect(mockFarmPlotService.updateFarmPlot).toHaveBeenCalledWith('plot-1', expect.objectContaining({ title: 'Updated Title' }));
      // g2 is newly desired but not in existing gallery -> add
      expect(mockFarmPlotService.addFarmPlotGalleryImage).toHaveBeenCalledWith('plot-1', { imageUuid: 'g2' });
      // g-old exists but is no longer desired -> remove
      expect(mockFarmPlotService.deleteFarmPlotGalleryImage).toHaveBeenCalledWith('plot-1', 'gal-old');
      // g1 already exists and is still desired -> no call for it
      expect(mockFarmPlotService.addFarmPlotGalleryImage).not.toHaveBeenCalledWith('plot-1', { imageUuid: 'g1' });

      expect(component.isLoading).toBe(false);
      expect(component.visible).toBe(false);
      expect(visibleChangeSpy).toHaveBeenCalledWith(false);
      expect(component.currentStep).toBe(1);
      expect(mockToastService.success).toHaveBeenCalled();
      expect(updatedSpy).toHaveBeenCalled();
      // Unlike create, a successful edit does not blow away in-progress wizard state.
      expect(mockWizard.reset).not.toHaveBeenCalled();
    });

    it('shows an error toast and leaves the modal open when the update fails', () => {
      mockWizard.getValue.mockReturnValue({ title: 'Updated Title' } as any);
      mockFarmPlotService.updateFarmPlot.mockReturnValue(throwError(() => new Error('boom')));

      component.onSubmit();

      expect(mockToastService.error).toHaveBeenCalledWith('boom', 'Update Farm Plot');
      expect(component.isLoading).toBe(false);
      expect(component.visible).toBe(true);
      expect(component.currentStep).toBe(3);
    });

    it('shows a distinct toast when the gallery sync fails after a successful update', () => {
      mockWizard.getValue.mockReturnValue({ title: 'Updated Title' } as any);
      mockWizard.getGalleryImageUuids.mockReturnValue(['g1']);
      mockFarmPlotService.updateFarmPlot.mockReturnValue(of({ id: 'plot-1' } as any));
      mockFarmPlotService.getFarmPlotGallery.mockReturnValue(of([]));
      mockFarmPlotService.addFarmPlotGalleryImage.mockReturnValue(throwError(() => new Error('gallery boom')));

      component.onSubmit();

      expect(mockToastService.error).toHaveBeenCalledWith('gallery boom', 'Update Farm Plot Gallery');
      expect(component.isLoading).toBe(false);
    });

    it('jumps back to the first invalid step and never calls the API on a defensive re-check failure', () => {
      mockWizard.isStepValid.mockImplementation((step: number) => step !== 2);

      component.onSubmit();

      expect(component.currentStep).toBe(2);
      expect(mockWizard.markStepTouched).toHaveBeenCalledWith(2);
      expect(mockFarmPlotService.updateFarmPlot).not.toHaveBeenCalled();
    });
  });

  describe('onCancelled', () => {
    it('resets currentStep to 1 and reverts the wizard to the loaded plot values', () => {
      component.currentStep = 3;
      component.onCancelled();
      expect(component.currentStep).toBe(1);
      expect(mockWizard.reset).toHaveBeenCalled();
    });
  });
});
