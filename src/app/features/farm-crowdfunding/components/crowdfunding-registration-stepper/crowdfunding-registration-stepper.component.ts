import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {StepperComponent, StepConfig} from '../../../../shared/components/stepper/stepper.component';
import {FarmPlot} from '../../../farm-plots/models/farm-plot.model';
import {
  CrowdfundingCampaignCreateRequest,
  FarmActivity,
  FarmOperationCreateRequest,
  FundingStatus,
  WaterSource,
} from '../../models/farm-crowdfunding.model';
import {CrowdfundingOperationFormComponent} from '../crowdfunding-operation-form/crowdfunding-operation-form.component';
import {CrowdfundingCampaignFormComponent} from '../crowdfunding-campaign-form/crowdfunding-campaign-form.component';

@Component({
  selector: 'app-crowdfunding-registration-stepper',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StepperComponent,
    CrowdfundingOperationFormComponent,
    CrowdfundingCampaignFormComponent,
  ],
  templateUrl: './crowdfunding-registration-stepper.component.html',
  styleUrls: ['./crowdfunding-registration-stepper.component.css'],
})
export class CrowdfundingRegistrationStepperComponent implements OnChanges {
  @Input() currentStep = 1;
  @Input() farmPlots: FarmPlot[] = [];
  @Input() isSaving = false;
  @Input() readOnly = false;

  @Input() operationId: string | null = null;

  @Output() currentStepChange = new EventEmitter<number>();
  @Output() operationSubmit = new EventEmitter<FarmOperationCreateRequest>();
  @Output() campaignSubmit = new EventEmitter<CrowdfundingCampaignCreateRequest>();
  @Output() completed = new EventEmitter<void>();
  @Output() cancelRequested = new EventEmitter<void>();

  @ViewChild('operationForm') operationForm?: CrowdfundingOperationFormComponent;
  @ViewChild('campaignForm') campaignForm?: CrowdfundingCampaignFormComponent;

  readonly steps: StepConfig[] = [
    {label: 'Operation', description: 'Farm operation details', clickable: true},
    {label: 'Campaign', description: 'Funding campaign details', clickable: true},
    {label: 'Review', description: 'Review & create', clickable: true},
  ];

  cachedOperationRequest: FarmOperationCreateRequest | null = null;
  cachedCampaignRequest: CrowdfundingCampaignCreateRequest | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['operationId'] && !this.operationId) {
      this.cachedCampaignRequest = null;
    }
  }

  get selectedFarmPlotTitle(): string {
    const id = this.cachedOperationRequest?.farmPlotId;
    if (!id) return '-';
    return this.farmPlots?.find((p) => p.id === id)?.title ?? '-';
  }

  get operationSummary(): {activity: FarmActivity | '-'; water: WaterSource | '-'; start: string; end: string} {
    return {
      activity: this.cachedOperationRequest?.farmActivity ?? '-',
      water: this.cachedOperationRequest?.waterSource ?? '-',
      start: this.cachedOperationRequest?.startDate ?? '-',
      end: this.cachedOperationRequest?.endDate ?? '-',
    };
  }

  get campaignSummary(): {status: FundingStatus | '-'; deadline: string; target: number | null; minimum: number | null} {
    return {
      status: this.cachedCampaignRequest?.fundingStatus ?? '-',
      deadline: this.cachedCampaignRequest?.fundingDeadline ?? '-',
      target: this.cachedCampaignRequest?.targetAmount ?? null,
      minimum: this.cachedCampaignRequest?.minimumContribution ?? null,
    };
  }

  nextStep(): void {
    if (this.readOnly) return;

    if (this.currentStep === 1) {
      if (!this.operationForm?.isValid()) {
        this.operationForm?.markAllAsTouched();
        return;
      }
      const v = this.operationForm.getValue();
      this.cachedOperationRequest = v;
      this.operationSubmit.emit(v);
      return;
    }

    if (this.currentStep === 2) {
      if (!this.operationId) return;
      if (!this.campaignForm?.isValid()) {
        this.campaignForm?.markAllAsTouched();
        return;
      }
      const v = this.campaignForm.getValue(this.operationId);
      this.cachedCampaignRequest = v;
      this.campaignSubmit.emit(v);
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
}

