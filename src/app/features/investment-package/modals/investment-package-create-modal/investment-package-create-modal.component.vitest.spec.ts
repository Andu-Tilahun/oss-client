import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { InvestmentPackageCreateModalComponent } from './investment-package-create-modal.component';

function makeComponent() {
  const mockInvestmentPackageService = {
    create: vi.fn(),
  };
  const mockToastService = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
  const mockWizard = {
    isStepValid: vi.fn(() => true),
    markStepTouched: vi.fn(),
    getValue: vi.fn(() => ({} as any)),
    reset: vi.fn(),
  };

  const component = new InvestmentPackageCreateModalComponent(mockInvestmentPackageService as any, mockToastService as any);
  component.wizard = mockWizard as any;

  return { component, mockInvestmentPackageService, mockToastService, mockWizard };
}

describe('InvestmentPackageCreateModalComponent', () => {
  let component: InvestmentPackageCreateModalComponent;
  let mockInvestmentPackageService: ReturnType<typeof makeComponent>['mockInvestmentPackageService'];
  let mockToastService: ReturnType<typeof makeComponent>['mockToastService'];
  let mockWizard: ReturnType<typeof makeComponent>['mockWizard'];

  beforeEach(() => {
    ({ component, mockInvestmentPackageService, mockToastService, mockWizard } = makeComponent());
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

    it('creates the package, resets to step 1, resets the wizard, and emits investmentPackageCreated', () => {
      mockWizard.getValue.mockReturnValue({ title: 'North Field Package' } as any);
      mockInvestmentPackageService.create.mockReturnValue(of({} as any));

      const createdSpy = vi.fn();
      component.investmentPackageCreated.subscribe(createdSpy);
      const visibleChangeSpy = vi.fn();
      component.visibleChange.subscribe(visibleChangeSpy);

      component.onSubmit();

      expect(mockInvestmentPackageService.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'North Field Package' }));
      expect(component.isLoading).toBe(false);
      expect(component.visible).toBe(false);
      expect(visibleChangeSpy).toHaveBeenCalledWith(false);
      expect(component.currentStep).toBe(1);
      expect(mockWizard.reset).toHaveBeenCalled();
      expect(mockToastService.success).toHaveBeenCalled();
      expect(createdSpy).toHaveBeenCalled();
    });

    it('shows an error toast and leaves the modal open when creation fails', () => {
      mockWizard.getValue.mockReturnValue({ title: 'North Field Package' } as any);
      mockInvestmentPackageService.create.mockReturnValue(throwError(() => new Error('boom')));

      component.onSubmit();

      expect(mockToastService.error).toHaveBeenCalledWith('boom', 'Create Investment Package');
      expect(component.isLoading).toBe(false);
      expect(component.visible).toBe(true);
      expect(component.currentStep).toBe(3);
      expect(mockWizard.reset).not.toHaveBeenCalled();
    });

    it('jumps back to the first invalid step and never calls the API on a defensive re-check failure', () => {
      mockWizard.isStepValid.mockImplementation((step: number) => step !== 2);

      component.onSubmit();

      expect(component.currentStep).toBe(2);
      expect(mockWizard.markStepTouched).toHaveBeenCalledWith(2);
      expect(mockInvestmentPackageService.create).not.toHaveBeenCalled();
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
