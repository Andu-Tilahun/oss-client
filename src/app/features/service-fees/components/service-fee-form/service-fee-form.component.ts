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
import {PaymentType, ServiceFee, ServiceFeeRequest} from '../../models/service-fee.model';

@Component({
  selector: 'app-service-fee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './service-fee-form.component.html',
  styleUrls: ['./service-fee-form.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ServiceFeeFormComponent),
      multi: true
    }
  ]
})
export class ServiceFeeFormComponent implements OnInit, OnChanges, ControlValueAccessor {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() serviceFee: ServiceFee | null = null;

  paymentTypeOptions: { value: PaymentType; label: string }[] = [
    {value: 'CLEARING_AGENT_CERTIFICATE_FEE', label: 'Clearing Agent Certificate Fee'},
  ];

  form: FormGroup;
  private onChange: any = () => {};
  private onTouched: any = () => {};

  constructor(private fb: FormBuilder) {
    this.form = this.createForm();
  }

  ngOnInit(): void {
    this.form.valueChanges.subscribe(value => {
      this.onChange(value);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['serviceFee'] && this.serviceFee && this.mode === 'edit') {
      this.patchFormValues(this.serviceFee);
      this.form.get('paymentType')?.disable({emitEvent: false});
    }
    if (changes['mode'] && this.mode === 'create') {
      this.form.get('paymentType')?.enable({emitEvent: false});
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      paymentType: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      description: ['']
    });
  }

  private patchFormValues(fee: ServiceFee): void {
    this.form.patchValue({
      paymentType: fee.paymentType,
      amount: fee.amount,
      description: fee.description || ''
    }, {emitEvent: false});
  }

  // ControlValueAccessor
  writeValue(value: ServiceFeeRequest | null): void {
    if (value) {
      this.form.patchValue(value, {emitEvent: false});
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    isDisabled ? this.form.disable({emitEvent: false}) : this.form.enable({emitEvent: false});
  }

  // Helpers (matching other forms)
  isValid(): boolean {
    return this.form.valid;
  }

  getValue(): ServiceFeeRequest {
    const raw = this.form.getRawValue();
    return {
      paymentType: raw.paymentType,
      amount: Number(raw.amount),
      description: raw.description || undefined,
    };
  }

  markAllAsTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsTouched();
    });
  }

  reset(): void {
    this.form.reset();
    if (this.mode === 'create') {
      this.form.get('paymentType')?.enable({emitEvent: false});
    }
  }
}

