import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {StepperComponent, StepConfig} from '../../../../shared/components/stepper/stepper.component';
import {FarmPlot} from '../../../farm-plots/models/farm-plot.model';
import {FarmLeaseFormComponent} from '../farm-lease-form/farm-lease-form.component';
import {FarmLeasePaymentPageComponent} from '../farm-lease-payment-page/farm-lease-payment-page.component';
import {
  LeaseAgreement,
  LeaseCreateRequest,
  LeaseDefineTermsRequest,
  LeaseTerm,
} from '../../models/farm-lease.model';

@Component({
  selector: 'app-lease-registration-stepper',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StepperComponent,
    FarmLeaseFormComponent,
    FarmLeasePaymentPageComponent,
  ],
  templateUrl: './lease-registration-stepper.component.html',
  styleUrls: ['./lease-registration-stepper.component.css'],
})
export class LeaseRegistrationStepperComponent implements OnChanges {
  @Input() currentStep = 1;

  @Input() farmPlots: FarmPlot[] = [];
  @Input() isLoading = false;
  @Input() isSaving = false;

  @Input() embedded = false;

  @Input() readOnly = false;

  @Input() lease: LeaseAgreement | null = null;

  @Output() currentStepChange = new EventEmitter<number>();
  @Output() leaseDetailsSubmit = new EventEmitter<LeaseCreateRequest>();
  @Output() paymentSubmit = new EventEmitter<LeaseDefineTermsRequest>();
  @Output() completed = new EventEmitter<void>();
  @Output() cancelRequested = new EventEmitter<void>();

  @ViewChild('farmLeaseForm') farmLeaseForm?: FarmLeaseFormComponent;
  @ViewChild('paymentPage') paymentPage?: FarmLeasePaymentPageComponent;

  readonly steps: StepConfig[] = [
    {label: 'Lease details', description: 'Agreement information', clickable: true},
    {label: 'Payment', description: 'Payment schedule', clickable: true},
    {label: 'Review', description: 'Review & confirm', clickable: true},
  ];

  /** Snapshot after step 1; drives payment step and review. */
  cachedLeaseRequest: LeaseCreateRequest | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lease'] && this.lease) {
      this.cachedLeaseRequest = {
        farmPlotId: this.lease.farmPlotId,
        startDate: this.lease.startDate,
        totalDurationMonths: this.lease.totalDurationMonths,
        totalAmount: this.lease.totalAmount,
        endDate: this.lease.endDate,
      };
    }
  }

  get paymentTermsPreview(): LeaseTerm[] {
    return this.paymentPage?.paymentForm?.getPreviewTerms() ?? [];
  }

  get selectedFarmPlotTitle(): string {
    const id = this.cachedLeaseRequest?.farmPlotId;
    if (!id) return '-';
    return this.farmPlots?.find((p) => p.id === id)?.title ?? '-';
  }

  get calculatedEndDate(): string {
    const start = this.cachedLeaseRequest?.startDate;
    const months = this.cachedLeaseRequest?.totalDurationMonths;
    if (!start || !months) return '';
    return this.computeEndDate(start, months);
  }

  nextStep(): void {
    if (this.readOnly) return;

    if (this.currentStep === 1) {
      if (!this.farmLeaseForm?.isValid()) {
        this.farmLeaseForm?.markAllAsTouched();
        return;
      }

      const v = this.farmLeaseForm.getValue();
      const endDate = this.computeEndDate(v.startDate, v.totalDurationMonths);

      this.cachedLeaseRequest = {
        farmPlotId: v.farmPlotId,
        startDate: v.startDate,
        totalDurationMonths: v.totalDurationMonths,
        totalAmount: v.totalAmount,
        endDate,
      };

      this.leaseDetailsSubmit.emit(this.cachedLeaseRequest);
      return;
    }

    if (this.currentStep === 2) {
      const pf = this.paymentPage?.paymentForm;
      if (!pf?.isValid()) {
        pf?.markAllAsTouched();
        return;
      }

      this.paymentSubmit.emit(pf.getValue());
      return;
    }

    if (this.currentStep === 3) {
      this.completed.emit();
    }
  }

  previousStep(): void {
    if (this.readOnly) return;

    if (this.currentStep > 1) {
      this.currentStepChange.emit(this.currentStep - 1);
    }
  }

  goToStep(step: number): void {
    if (this.readOnly) return;

    if (step < this.currentStep) {
      this.currentStepChange.emit(step);
    }
  }

  onCancel(): void {
    this.cancelRequested.emit();
  }

  private computeEndDate(startDateStr: string, durationMonths: number): string {
    const dt = new Date(startDateStr);
    dt.setMonth(dt.getMonth() + durationMonths - 1);
    return dt.toISOString().slice(0, 10);
  }
}
