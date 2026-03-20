import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {StepperComponent, StepConfig} from '../../../../../shared/components/stepper/stepper.component';
import {FarmPlot} from '../../../farm-plots/models/farm-plot.model';
import {LeaseCreateRequest, LeaseGenerateTermsRequest, LeaseTerm} from '../../models/farm-lease.model';
import {StepperComponent} from "../../../../shared/components/stepper/stepper.component";

@Component({
  selector: 'app-lease-registration-stepper',
  standalone: true,
    imports: [CommonModule, ReactiveFormsModule, StepperComponent, StepperComponent],
  templateUrl: './lease-registration-stepper.component.html',
  styleUrls: ['./lease-registration-stepper.component.css'],
})
export class LeaseRegistrationStepperComponent implements OnInit, OnChanges {
  @Input() currentStep = 1;

  @Input() farmPlots: FarmPlot[] = [];
  @Input() isLoading = false;
  @Input() isSaving = false;

  // Future: when edit-mode is added, this can be used to patch forms.
  @Input() lease: any = null;

  @Output() currentStepChange = new EventEmitter<number>();
  @Output() leaseDetailsSubmit = new EventEmitter<LeaseCreateRequest>();
  @Output() paymentSubmit = new EventEmitter<LeaseGenerateTermsRequest>();
  @Output() completed = new EventEmitter<void>();
  @Output() cancelRequested = new EventEmitter<void>();

  readonly steps: StepConfig[] = [
    {label: 'Lease details', description: 'Agreement information', clickable: true},
    {label: 'Payment', description: 'Generate payment schedule', clickable: true},
    {label: 'Review', description: 'Review & confirm', clickable: true},
  ];

  leaseDetailsForm!: FormGroup;
  paymentForm!: FormGroup;

  paymentTermsPreview: LeaseTerm[] = [];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForms();
    this.leaseDetailsForm.get('startDate')?.valueChanges.subscribe(() => {
      const startDate = this.leaseDetailsForm.get('startDate')?.value;
      const paymentStartDate = this.paymentForm.get('paymentStartDate')?.value;
      if (!paymentStartDate && startDate) {
        this.paymentForm.patchValue({paymentStartDate: startDate}, {emitEvent: false});
      }
      this.buildPaymentPreview();
    });

    this.leaseDetailsForm.valueChanges.subscribe(() => this.buildPaymentPreview());
    this.paymentForm.valueChanges.subscribe(() => this.buildPaymentPreview());

    this.buildPaymentPreview();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['farmPlots'] && this.farmPlots?.length && !this.leaseDetailsForm?.get('farmPlotId')?.value) {
      // Optional: default select first plot
      // Keep it non-invasive; user can still change it.
      const currentVal = this.leaseDetailsForm.get('farmPlotId')?.value;
      if (!currentVal) {
        this.leaseDetailsForm.patchValue({farmPlotId: this.farmPlots[0].id}, {emitEvent: false});
      }
    }
  }

  private initializeForms(): void {
    this.leaseDetailsForm = this.fb.group({
      farmPlotId: ['', Validators.required],
      startDate: ['', Validators.required],
      totalDurationMonths: [1, [Validators.required, Validators.min(1)]],
      totalAmount: [0, [Validators.required, Validators.min(0.01)]],
    });

    this.paymentForm = this.fb.group({
      paymentStartDate: ['', Validators.required],
    });
  }

  private buildPaymentPreview(): void {
    const paymentStartDate: string = this.paymentForm.get('paymentStartDate')?.value;
    const durationMonths: number = Number(this.leaseDetailsForm.get('totalDurationMonths')?.value || 0);
    const totalAmount: number = Number(this.leaseDetailsForm.get('totalAmount')?.value || 0);

    if (!paymentStartDate || !durationMonths || !totalAmount) {
      this.paymentTermsPreview = [];
      return;
    }

    // Backend splits into installments using 4 decimal places and pushes rounding remainder into the last term.
    const scale = 10000;
    const totalInt = Math.round(totalAmount * scale);
    const perTermInt = Math.round(totalInt / durationMonths);
    const remainderInt = totalInt - perTermInt * durationMonths;
    const perTerm = perTermInt / scale;
    const remainder = remainderInt / scale;

    const terms: LeaseTerm[] = [];
    for (let i = 0; i < durationMonths; i++) {
      const dt = new Date(paymentStartDate);
      dt.setMonth(dt.getMonth() + i);
      const dateStr = dt.toISOString().slice(0, 10);

      const amount = i === durationMonths - 1 ? perTerm + remainder : perTerm;

      terms.push({
        id: '',
        scheduledDate: dateStr,
        dueDate: dateStr,
        amount,
        paidDate: undefined,
        status: 'ACTIVE',
      });
    }

    this.paymentTermsPreview = terms;
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      if (this.leaseDetailsForm.invalid) {
        this.leaseDetailsForm.markAllAsTouched();
        return;
      }

      const val = this.leaseDetailsForm.getRawValue();
      const startDate = val.startDate as string;
      const totalDurationMonths = Number(val.totalDurationMonths);

      const computedEndDate = this.calculateEndDate(startDate, totalDurationMonths);

      const request: LeaseCreateRequest = {
        farmPlotId: val.farmPlotId,
        startDate,
        totalDurationMonths,
        endDate: computedEndDate,
        totalAmount: Number(val.totalAmount),
      };

      this.leaseDetailsForm.updateValueAndValidity();
      this.leaseDetailsSubmit.emit(request);
      return;
    }

    if (this.currentStep === 2) {
      if (this.paymentForm.invalid) {
        this.paymentForm.markAllAsTouched();
        return;
      }

      const paymentStartDate = this.paymentForm.get('paymentStartDate')?.value as string;
      const request: LeaseGenerateTermsRequest = {paymentStartDate};

      this.paymentSubmit.emit(request);
      return;
    }

    if (this.currentStep === 3) {
      this.completed.emit();
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStepChange.emit(this.currentStep - 1);
    }
  }

  goToStep(step: number): void {
    if (step < this.currentStep) {
      this.currentStepChange.emit(step);
    }
  }

  onCancel(): void {
    this.cancelRequested.emit();
  }

  private calculateEndDate(startDateStr: string, durationMonths: number): string {
    const dt = new Date(startDateStr);
    dt.setMonth(dt.getMonth() + durationMonths - 1);
    return dt.toISOString().slice(0, 10);
  }

  get calculatedEndDate(): string {
    const startDate = this.leaseDetailsForm.get('startDate')?.value;
    const durationMonths = Number(this.leaseDetailsForm.get('totalDurationMonths')?.value || 0);
    if (!startDate || !durationMonths) return '';
    return this.calculateEndDate(startDate, durationMonths);
  }

  get totalAmountPreview(): number {
    return Number(this.leaseDetailsForm.get('totalAmount')?.value || 0);
  }
}
