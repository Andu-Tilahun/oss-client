import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { InvestmentPackageEditModalComponent } from './investment-package-edit-modal.component';
import { InvestmentPackage } from '../../models/investment-package.model';

function mockPackage(overrides: Partial<InvestmentPackage> = {}): InvestmentPackage {
  return { id: 'pkg-1', title: 'North Field Package', investmentPackageType: 'CROWDFUNDING', ...overrides } as InvestmentPackage;
}

function makeComponent() {
  const mockInvestmentPackageService = {
    updateInvestmentPackage: vi.fn(),
  };
  const mockToastService = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
  const mockWizard = {
    isStepValid: vi.fn(() => true),
    markStepTouched: vi.fn(),
    getValue: vi.fn(() => ({} as any)),
    reset: vi.fn(),
  };

  const component = new InvestmentPackageEditModalComponent(mockInvestmentPackageService as any, mockToastService as any);
  component.wizard = mockWizard as any;

  return { component, mockInvestmentPackageService, mockToastService, mockWizard };
}

describe('InvestmentPackageEditModalComponent', () => {
  let component: InvestmentPackageEditModalComponent;
  let mockInvestmentPackageService: ReturnType<typeof makeComponent>['mockInvestmentPackageService'];
  let mockToastService: ReturnType<typeof makeComponent>['mockToastService'];
  let mockWizard: ReturnType<typeof makeComponent>['mockWizard'];

  beforeEach(() => {
    ({ component, mockInvestmentPackageService, mockToastService, mockWizard } = makeComponent());
  });

  it('should create', () => expect(component).toBeTruthy());

  describe('title', () => {
    it('shows "Edit Leasing Investment Package" for a LEASING package', () => {
      component.investmentPackage = mockPackage({ investmentPackageType: 'LEASING' });
      expect(component.title).toBe('Edit Leasing Investment Package');
    });

    it('shows "Edit Bidding Investment Package" for a BIDDING package', () => {
      component.investmentPackage = mockPackage({ investmentPackageType: 'BIDDING' });
      expect(component.title).toBe('Edit Bidding Investment Package');
    });

    it('shows "Edit Crowdfunding Investment Package" for a CROWDFUNDING package', () => {
      component.investmentPackage = mockPackage({ investmentPackageType: 'CROWDFUNDING' });
      expect(component.title).toBe('Edit Crowdfunding Investment Package');
    });

    it('never hardcodes "Edit Crowd Funding" regardless of the selected package type', () => {
      component.investmentPackage = mockPackage({ investmentPackageType: 'LEASING' });
      expect(component.title).not.toBe('Edit Crowd Funding');

      component.investmentPackage = mockPackage({ investmentPackageType: 'BIDDING' });
      expect(component.title).not.toBe('Edit Crowd Funding');
    });
  });

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
      component.investmentPackage = mockPackage();
    });

    it('updates the package, resets to step 1, and emits investmentPackageUpdated', () => {
      mockWizard.getValue.mockReturnValue({ title: 'Updated Title' } as any);
      mockInvestmentPackageService.updateInvestmentPackage.mockReturnValue(of({} as any));

      const updatedSpy = vi.fn();
      component.investmentPackageUpdated.subscribe(updatedSpy);
      const visibleChangeSpy = vi.fn();
      component.visibleChange.subscribe(visibleChangeSpy);

      component.onSubmit();

      expect(mockInvestmentPackageService.updateInvestmentPackage).toHaveBeenCalledWith(
        'pkg-1',
        expect.objectContaining({ title: 'Updated Title' }),
      );
      expect(component.isLoading).toBe(false);
      expect(component.visible).toBe(false);
      expect(visibleChangeSpy).toHaveBeenCalledWith(false);
      expect(component.currentStep).toBe(1);
      expect(mockToastService.success).toHaveBeenCalled();
      expect(updatedSpy).toHaveBeenCalled();
    });

    it('shows an error toast and leaves the modal open when the update fails', () => {
      mockWizard.getValue.mockReturnValue({ title: 'Updated Title' } as any);
      mockInvestmentPackageService.updateInvestmentPackage.mockReturnValue(throwError(() => new Error('boom')));

      component.onSubmit();

      expect(mockToastService.error).toHaveBeenCalledWith('boom', 'Update Investment Package');
      expect(component.isLoading).toBe(false);
      expect(component.visible).toBe(true);
      expect(component.currentStep).toBe(3);
    });

    it('jumps back to the first invalid step and never calls the API on a defensive re-check failure', () => {
      mockWizard.isStepValid.mockImplementation((step: number) => step !== 2);

      component.onSubmit();

      expect(component.currentStep).toBe(2);
      expect(mockWizard.markStepTouched).toHaveBeenCalledWith(2);
      expect(mockInvestmentPackageService.updateInvestmentPackage).not.toHaveBeenCalled();
    });

    it('does nothing when there is no investment package to update', () => {
      component.investmentPackage = null;
      component.onSubmit();
      expect(mockInvestmentPackageService.updateInvestmentPackage).not.toHaveBeenCalled();
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
