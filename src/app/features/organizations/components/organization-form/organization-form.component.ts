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
import {Organization, OrganizationRequest, OrganizationType} from '../../models/organization.model';

@Component({
  selector: 'app-organization-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './organization-form.component.html',
  styleUrls: ['./organization-form.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OrganizationFormComponent),
      multi: true
    }
  ]
})
export class OrganizationFormComponent implements OnInit, OnChanges, ControlValueAccessor {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() organization: Organization | null = null;

  organizationForm: FormGroup;
  private onChange: any = () => {};
  private onTouched: any = () => {};

  organizationTypes: { label: string; value: OrganizationType }[] = [
    {label: 'Clearing Agent', value: 'CLEARING_AGENT'},
    {label: 'Training Provider', value: 'TRAINING_PROVIDER'}
  ];

  constructor(private fb: FormBuilder) {
    this.organizationForm = this.createForm();
  }

  ngOnInit(): void {
    this.organizationForm.valueChanges.subscribe(value => {
      this.onChange(value);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['organization'] && this.organization && this.mode === 'edit') {
      this.patchFormValues(this.organization);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      organizationType: ['', Validators.required]
    });
  }

  private patchFormValues(organization: Organization): void {
    this.organizationForm.patchValue({
      name: organization.name,
      organizationType: organization.organizationType
    });
  }

  // ControlValueAccessor
  writeValue(value: OrganizationRequest | null): void {
    if (value) {
      this.organizationForm.patchValue(value, {emitEvent: false});
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    isDisabled ? this.organizationForm.disable() : this.organizationForm.enable();
  }

  // Helpers
  isValid(): boolean {
    return this.organizationForm.valid;
  }

  getValue(): OrganizationRequest {
    return this.organizationForm.getRawValue();
  }

  markAllAsTouched(): void {
    Object.keys(this.organizationForm.controls).forEach(key => {
      this.organizationForm.get(key)?.markAsTouched();
    });
  }

  reset(): void {
    this.organizationForm.reset();
  }
}

