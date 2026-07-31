import { ValidatorFn } from '@angular/forms';

function decimalPlaces(value: unknown): number {
  const s = String(value);
  const dot = s.indexOf('.');
  return dot === -1 ? 0 : s.length - dot - 1;
}

export function latitudeValidator(precision = 6): ValidatorFn {
  return (control) => {
    const val = control.value;
    if (val === null || val === undefined || val === '') return null;
    const n = Number(val);
    if (!isFinite(n) || isNaN(n)) return { coordinateInvalid: true };
    if (n < -90 || n > 90) return { latRange: true };
    if (decimalPlaces(val) > precision) return { coordinatePrecision: { max: precision } };
    return null;
  };
}

export function longitudeValidator(precision = 6): ValidatorFn {
  return (control) => {
    const val = control.value;
    if (val === null || val === undefined || val === '') return null;
    const n = Number(val);
    if (!isFinite(n) || isNaN(n)) return { coordinateInvalid: true };
    if (n < -180 || n > 180) return { lngRange: true };
    if (decimalPlaces(val) > precision) return { coordinatePrecision: { max: precision } };
    return null;
  };
}
