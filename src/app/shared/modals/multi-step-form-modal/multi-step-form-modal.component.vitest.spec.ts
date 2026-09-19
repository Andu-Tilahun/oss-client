import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MultiStepFormModalComponent } from './multi-step-form-modal.component';

describe('MultiStepFormModalComponent', () => {
  let component: MultiStepFormModalComponent;

  beforeEach(() => {
    component = new MultiStepFormModalComponent();
    component.steps = [{ label: 'One' }, { label: 'Two' }, { label: 'Three' }];
  });

  it('should create', () => expect(component).toBeTruthy());

  describe('previousStep', () => {
    it('emits currentStep - 1 when not on the first step', () => {
      component.currentStep = 2;
      const spy = vi.fn();
      component.currentStepChange.subscribe(spy);

      component.previousStep();

      expect(spy).toHaveBeenCalledWith(1);
    });

    it('does nothing on the first step (no validation needed for backward nav, but there is nowhere to go)', () => {
      component.currentStep = 1;
      const spy = vi.fn();
      component.currentStepChange.subscribe(spy);

      component.previousStep();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('goToStep', () => {
    it('emits the requested step directly (stepper only allows clicking completed steps)', () => {
      const spy = vi.fn();
      component.currentStepChange.subscribe(spy);

      component.goToStep(1);

      expect(spy).toHaveBeenCalledWith(1);
    });
  });

  describe('handleClosed', () => {
    it('emits cancelled exactly once, regardless of which close trigger fired it', () => {
      const spy = vi.fn();
      component.cancelled.subscribe(spy);

      component.handleClosed();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('forward-nav / submit intents', () => {
    it('next.emit() notifies subscribers so the parent can validate before advancing', () => {
      const spy = vi.fn();
      component.next.subscribe(spy);

      component.next.emit();

      expect(spy).toHaveBeenCalled();
    });

    it('submitForm.emit() notifies subscribers on the final step', () => {
      const spy = vi.fn();
      component.submitForm.subscribe(spy);

      component.submitForm.emit();

      expect(spy).toHaveBeenCalled();
    });
  });
});
