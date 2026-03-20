import {Component, Input, OnChanges, OnInit, SimpleChanges, forwardRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {Subcity, SubcityRequest} from '../../models/subcity.model';
import {Region} from '../../../regions/models/region.model';

@Component({
  selector: 'app-subcity-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './subcity-form.component.html',
  styleUrls: ['./subcity-form.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SubcityFormComponent),
      multi: true
    }
  ]
})
export class SubcityFormComponent implements OnInit, OnChanges, ControlValueAccessor {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() subcity: Subcity | null = null;
  @Input() regions: Region[] = [];

  subcityForm: FormGroup;
  private onChange: any = () => {};
  private onTouched: any = () => {};

  constructor(private fb: FormBuilder) {
    this.subcityForm = this.createForm();
  }

  ngOnInit(): void {
    this.subcityForm.valueChanges.subscribe(value => {
      this.onChange(value);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['subcity'] && this.subcity && this.mode === 'edit') {
      this.patchFormValues(this.subcity);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      regionId: ['', Validators.required]
    });
  }

  private patchFormValues(subcity: Subcity): void {
    this.subcityForm.patchValue({
      name: subcity.name,
      regionId: subcity.regionId
    });
  }

  // ControlValueAccessor
  writeValue(value: SubcityRequest | null): void {
    if (value) {
      this.subcityForm.patchValue(value, {emitEvent: false});
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    isDisabled ? this.subcityForm.disable() : this.subcityForm.enable();
  }

  // Helpers
  isValid(): boolean {
    return this.subcityForm.valid;
  }

  getValue(): SubcityRequest {
    return this.subcityForm.getRawValue();
  }

  markAllAsTouched(): void {
    Object.keys(this.subcityForm.controls).forEach(key => {
      this.subcityForm.get(key)?.markAsTouched();
    });
  }

  reset(): void {
    this.subcityForm.reset();
  }
}

