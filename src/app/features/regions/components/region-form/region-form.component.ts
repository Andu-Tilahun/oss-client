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
import {Region, RegionRequest} from '../../models/region.model';

@Component({
  selector: 'app-region-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './region-form.component.html',
  styleUrls: ['./region-form.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RegionFormComponent),
      multi: true
    }
  ]
})
export class RegionFormComponent implements OnInit, OnChanges, ControlValueAccessor {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() region: Region | null = null;

  regionForm: FormGroup;
  private onChange: any = () => {};
  private onTouched: any = () => {};

  constructor(private fb: FormBuilder) {
    this.regionForm = this.createForm();
  }

  ngOnInit(): void {
    this.regionForm.valueChanges.subscribe(value => {
      this.onChange(value);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['region'] && this.region && this.mode === 'edit') {
      this.patchFormValues(this.region);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required]
    });
  }

  private patchFormValues(region: Region): void {
    this.regionForm.patchValue({
      name: region.name
    });
  }

  // ControlValueAccessor
  writeValue(value: RegionRequest | null): void {
    if (value) {
      this.regionForm.patchValue(value, {emitEvent: false});
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    isDisabled ? this.regionForm.disable() : this.regionForm.enable();
  }

  // Helpers
  isValid(): boolean {
    return this.regionForm.valid;
  }

  getValue(): RegionRequest {
    return this.regionForm.getRawValue();
  }

  markAllAsTouched(): void {
    Object.keys(this.regionForm.controls).forEach(key => {
      this.regionForm.get(key)?.markAsTouched();
    });
  }

  reset(): void {
    this.regionForm.reset();
  }
}

