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
import {Woreda, WoredaRequest} from '../../models/woreda.model';
import {Subcity} from '../../../subcities/models/subcity.model';

@Component({
  selector: 'app-woreda-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './woreda-form.component.html',
  styleUrls: ['./woreda-form.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WoredaFormComponent),
      multi: true
    }
  ]
})
export class WoredaFormComponent implements OnInit, OnChanges, ControlValueAccessor {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() woreda: Woreda | null = null;
  @Input() subcities: Subcity[] = [];

  woredaForm: FormGroup;
  private onChange: any = () => {};
  private onTouched: any = () => {};

  constructor(private fb: FormBuilder) {
    this.woredaForm = this.createForm();
  }

  ngOnInit(): void {
    this.woredaForm.valueChanges.subscribe(value => {
      this.onChange(value);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['woreda'] && this.woreda && this.mode === 'edit') {
      this.patchFormValues(this.woreda);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      subcityId: ['', Validators.required]
    });
  }

  private patchFormValues(woreda: Woreda): void {
    this.woredaForm.patchValue({
      name: woreda.name,
      subcityId: woreda.subcityId
    });
  }

  // ControlValueAccessor
  writeValue(value: WoredaRequest | null): void {
    if (value) {
      this.woredaForm.patchValue(value, {emitEvent: false});
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    isDisabled ? this.woredaForm.disable() : this.woredaForm.enable();
  }

  // Helpers
  isValid(): boolean {
    return this.woredaForm.valid;
  }

  getValue(): WoredaRequest {
    return this.woredaForm.getRawValue();
  }

  markAllAsTouched(): void {
    Object.keys(this.woredaForm.controls).forEach(key => {
      this.woredaForm.get(key)?.markAsTouched();
    });
  }

  reset(): void {
    this.woredaForm.reset();
  }
}

