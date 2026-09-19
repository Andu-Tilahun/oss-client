import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { FarmPlotCreateModalComponent } from './farm-plot-create-modal.component';

function makeComponent() {
  const mockFarmPlotService = {
    createFarmPlot: vi.fn(),
    addFarmPlotGalleryImage: vi.fn(),
  };
  const mockToastService = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
  const mockWizard = {
    isStepValid: vi.fn(() => true),
    markStepTouched: vi.fn(),
    uploadPendingMainImage: vi.fn(() => of(undefined)),
    getValue: vi.fn(() => ({} as any)),
    getGalleryImageUuids: vi.fn(() => [] as string[]),
    reset: vi.fn(),
  };

  const component = new FarmPlotCreateModalComponent(mockFarmPlotService as any, mockToastService as any);
  component.wizard = mockWizard as any;

  return { component, mockFarmPlotService, mockToastService, mockWizard };
}

describe('FarmPlotCreateModalComponent', () => {
  let component: FarmPlotCreateModalComponent;
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
      expect(mockWizard.markStepTouched).not.toHaveBeenCalled();
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

    it('uploads the image, creates the plot, syncs gallery images, resets to step 1, and emits farmPlotCreated', () => {
      mockWizard.uploadPendingMainImage.mockReturnValue(of('img-uuid'));
      mockWizard.getValue.mockReturnValue({ title: 'North Field' } as any);
      mockWizard.getGalleryImageUuids.mockReturnValue(['g1', 'g2']);
      mockFarmPlotService.createFarmPlot.mockReturnValue(of({ id: 'plot-1' } as any));
      mockFarmPlotService.addFarmPlotGalleryImage.mockReturnValue(of({} as any));

      const createdSpy = vi.fn();
      component.farmPlotCreated.subscribe(createdSpy);
      const visibleChangeSpy = vi.fn();
      component.visibleChange.subscribe(visibleChangeSpy);

      component.onSubmit();

      expect(mockFarmPlotService.createFarmPlot).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'North Field', imageUuid: 'img-uuid' }),
      );
      expect(mockFarmPlotService.addFarmPlotGalleryImage).toHaveBeenCalledWith('plot-1', { imageUuid: 'g1' });
      expect(mockFarmPlotService.addFarmPlotGalleryImage).toHaveBeenCalledWith('plot-1', { imageUuid: 'g2' });
      expect(component.isLoading).toBe(false);
      expect(component.visible).toBe(false);
      expect(visibleChangeSpy).toHaveBeenCalledWith(false);
      // Regression guard: reopening the modal must land back on step 1, not the last step used.
      expect(component.currentStep).toBe(1);
      expect(mockWizard.reset).toHaveBeenCalled();
      expect(mockToastService.success).toHaveBeenCalled();
      expect(createdSpy).toHaveBeenCalled();
    });

    it('skips the gallery forkJoin call when there are no gallery images', () => {
      mockWizard.uploadPendingMainImage.mockReturnValue(of(undefined));
      mockWizard.getValue.mockReturnValue({ title: 'North Field' } as any);
      mockWizard.getGalleryImageUuids.mockReturnValue([]);
      mockFarmPlotService.createFarmPlot.mockReturnValue(of({ id: 'plot-1' } as any));

      component.onSubmit();

      expect(mockFarmPlotService.addFarmPlotGalleryImage).not.toHaveBeenCalled();
      expect(component.currentStep).toBe(1);
    });

    it('shows an error toast and leaves the modal open when plot creation fails', () => {
      mockWizard.uploadPendingMainImage.mockReturnValue(of('img-uuid'));
      mockWizard.getValue.mockReturnValue({ title: 'North Field' } as any);
      mockFarmPlotService.createFarmPlot.mockReturnValue(throwError(() => new Error('boom')));

      component.onSubmit();

      expect(mockToastService.error).toHaveBeenCalledWith('boom', 'Create Farm Plot');
      expect(component.isLoading).toBe(false);
      expect(component.visible).toBe(true);
      expect(component.currentStep).toBe(3);
      expect(mockWizard.reset).not.toHaveBeenCalled();
    });

    it('shows a distinct toast when the plot is created but gallery sync fails', () => {
      mockWizard.uploadPendingMainImage.mockReturnValue(of('img-uuid'));
      mockWizard.getValue.mockReturnValue({ title: 'North Field' } as any);
      mockWizard.getGalleryImageUuids.mockReturnValue(['g1']);
      mockFarmPlotService.createFarmPlot.mockReturnValue(of({ id: 'plot-1' } as any));
      mockFarmPlotService.addFarmPlotGalleryImage.mockReturnValue(throwError(() => new Error('gallery boom')));

      component.onSubmit();

      expect(mockToastService.error).toHaveBeenCalledWith('gallery boom', 'Create Farm Plot Gallery');
      expect(component.isLoading).toBe(false);
    });

    it('jumps back to the first invalid step and never calls the API on a defensive re-check failure', () => {
      mockWizard.isStepValid.mockImplementation((step: number) => step !== 2);

      component.onSubmit();

      expect(component.currentStep).toBe(2);
      expect(mockWizard.markStepTouched).toHaveBeenCalledWith(2);
      expect(mockFarmPlotService.createFarmPlot).not.toHaveBeenCalled();
    });
  });

  describe('onCancelled', () => {
    it('resets currentStep to 1 and resets the wizard', () => {
      component.currentStep = 3;

      component.onCancelled();

      expect(component.currentStep).toBe(1);
      expect(mockWizard.reset).toHaveBeenCalled();
    });
  });
});
