import { describe, it, expect, vi } from 'vitest';
import { StatCardComponent } from './stat-card.component';

describe('StatCardComponent', () => {
  it('should create', () => {
    const component = new StatCardComponent();
    expect(component).toBeTruthy();
  });

  it('is not clickable by default', () => {
    const component = new StatCardComponent();
    expect(component.isClickable).toBe(false);
  });

  it('is clickable when routerLink is set', () => {
    const component = new StatCardComponent();
    component.routerLink = '/investment-package/active';
    expect(component.isClickable).toBe(true);
  });

  it('is clickable when clickable=true, even without a routerLink', () => {
    const component = new StatCardComponent();
    component.clickable = true;
    expect(component.isClickable).toBe(true);
  });

  it('onActivate emits cardClick when clickable', () => {
    const component = new StatCardComponent();
    component.clickable = true;
    const spy = vi.fn();
    component.cardClick.subscribe(spy);

    component.onActivate();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('onActivate does not emit cardClick when not clickable', () => {
    const component = new StatCardComponent();
    const spy = vi.fn();
    component.cardClick.subscribe(spy);

    component.onActivate();

    expect(spy).not.toHaveBeenCalled();
  });

  it('isNumericValue is true for a number and false for a pre-formatted string', () => {
    const component = new StatCardComponent();
    component.value = 42;
    expect(component.isNumericValue).toBe(true);

    component.value = '2 / 3';
    expect(component.isNumericValue).toBe(false);
  });

  it('falls back to the default variant styles for an unknown variant', () => {
    const component = new StatCardComponent();
    (component as any).variant = 'not-a-real-variant';
    expect(component.styles).toBe(component.variantStyles['default']);
  });
});
