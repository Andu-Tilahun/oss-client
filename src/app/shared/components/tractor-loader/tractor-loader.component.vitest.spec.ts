import { describe, it, expect, vi } from 'vitest';
import { TractorLoaderComponent } from './tractor-loader.component';

describe('TractorLoaderComponent', () => {
  it('should create', () => {
    const component = new TractorLoaderComponent();
    expect(component).toBeTruthy();
  });

  it('defaults to indeterminate mode with 0 progress', () => {
    const component = new TractorLoaderComponent();
    expect(component.mode).toBe('indeterminate');
    expect(component.progress).toBe(0);
  });

  describe('ngAfterViewInit', () => {
    it('does not throw when no canvas element is available', () => {
      const component = new TractorLoaderComponent();
      expect(() => component.ngAfterViewInit()).not.toThrow();
    });
  });

  describe('statusText', () => {
    it('shows "Plowing…" for indeterminate mode with no label', () => {
      const component = new TractorLoaderComponent();
      component.mode = 'indeterminate';
      expect(component.statusText).toBe('Plowing…');
    });

    it('shows a rounded percentage for progress mode with no label', () => {
      const component = new TractorLoaderComponent();
      component.mode = 'progress';
      component.progress = 42.6;
      expect(component.statusText).toBe('43% loaded');
    });

    it('prefers an explicit label over the computed default', () => {
      const component = new TractorLoaderComponent();
      component.mode = 'indeterminate';
      component.label = 'No investment packages published yet';
      expect(component.statusText).toBe('No investment packages published yet');
    });
  });

  describe('ngOnDestroy', () => {
    it('cancels the animation frame loop when one is running', () => {
      const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
      const component = new TractorLoaderComponent();
      (component as any).frameId = 123;

      component.ngOnDestroy();

      expect(cancelSpy).toHaveBeenCalledWith(123);
      expect((component as any).frameId).toBeNull();
      cancelSpy.mockRestore();
    });

    it('does nothing when no animation frame is running', () => {
      const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
      const component = new TractorLoaderComponent();

      expect(() => component.ngOnDestroy()).not.toThrow();
      expect(cancelSpy).not.toHaveBeenCalled();
      cancelSpy.mockRestore();
    });
  });
});
