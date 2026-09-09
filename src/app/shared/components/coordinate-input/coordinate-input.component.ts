import {
  Component,
  forwardRef,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { latitudeValidator, longitudeValidator } from '../../validators/coordinate-validators';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-coordinate-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CoordinateInputComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => CoordinateInputComponent),
      multi: true,
    },
  ],
  templateUrl: './coordinate-input.component.html',
})
export class CoordinateInputComponent
  implements ControlValueAccessor, Validator, OnInit, OnDestroy
{
  @Input() required = false;
  @Input() allowZeroCoordinates = true;
  @Input() precision = 6;

  inner = new FormGroup({
    latitude: new FormControl<number | null>(null),
    longitude: new FormControl<number | null>(null),
  });

  get lat(): AbstractControl {
    return this.inner.get('latitude')!;
  }

  get lng(): AbstractControl {
    return this.inner.get('longitude')!;
  }

  get stepValue(): string {
    return '0.' + '0'.repeat(this.precision - 1) + '1';
  }

  private onChange: (value: Coordinates | null) => void = () => {};
  private onTouched: () => void = () => {};
  private sub?: Subscription;
  private onValidatorChange: () => void = () => {};

  ngOnInit(): void {
    this.applyValidators();
    this.sub = this.inner.valueChanges.subscribe(() => {
      this.onChange(this.buildValue());
      this.onValidatorChange();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  applyValidators(): void {
    const latValidators = [latitudeValidator(this.precision)];
    const lngValidators = [longitudeValidator(this.precision)];
    if (this.required) {
      latValidators.unshift(Validators.required);
      lngValidators.unshift(Validators.required);
    }
    this.lat.setValidators(latValidators);
    this.lng.setValidators(lngValidators);
    this.inner.updateValueAndValidity();
  }

  writeValue(coords: Coordinates | null): void {
    if (coords) {
      this.inner.patchValue(
        { latitude: coords.latitude, longitude: coords.longitude },
        { emitEvent: false },
      );
    } else {
      this.inner.reset({ latitude: null, longitude: null }, { emitEvent: false });
    }
  }

  registerOnChange(fn: (value: Coordinates | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    disabled ? this.inner.disable() : this.inner.enable();
  }

  validate(_: AbstractControl): ValidationErrors | null {
    const latVal = this.lat.value;
    const lngVal = this.lng.value;
    const latFilled = latVal !== null && latVal !== undefined && latVal !== '';
    const lngFilled = lngVal !== null && lngVal !== undefined && lngVal !== '';

    if (this.inner.invalid) {
      return { coordinateInputInvalid: true };
    }

    if (latFilled !== lngFilled) {
      return { coordinatePairIncomplete: true };
    }

    if (!this.allowZeroCoordinates && latFilled && lngFilled) {
      if (Number(latVal) === 0 && Number(lngVal) === 0) {
        return { coordinatesZero: true };
      }
    }

    return null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  markAllAsTouched(): void {
    this.lat.markAsTouched();
    this.lng.markAsTouched();
  }

  onInputBlur(): void {
    this.onTouched();
  }

  private buildValue(): Coordinates | null {
    const { latitude, longitude } = this.inner.value;
    if (latitude === null && longitude === null) return null;
    if (latitude === undefined && longitude === undefined) return null;
    return { latitude: latitude as number, longitude: longitude as number };
  }
}
