import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {ToastService} from '../../../../shared/toast/toast.service';
import {FarmPlotService} from '../../../farm-plots/services/farm-plot.service';
import {FarmPlot, FarmPlotFilterRequest} from '../../../farm-plots/models/farm-plot.model';
import {FarmCrowdfundingService} from '../../services/farm-crowdfunding.service';
import {
  CrowdfundingRegistrationStepperComponent
} from '../../components/crowdfunding-registration-stepper/crowdfunding-registration-stepper.component';
import {
  CrowdfundingCampaignCreateRequest,
  FarmOperation,
  FarmOperationCreateRequest
} from '../../models/farm-crowdfunding.model';
import {ApiResponse} from "../../../../shared/models/api-response.model";

@Component({
  selector: 'app-farm-crowdfunding-create-campaign-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, CrowdfundingRegistrationStepperComponent],
  templateUrl: './farm-crowdfunding-create-campaign-modal.component.html',
})
export class FarmCrowdfundingCreateCampaignModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() campaignCreated = new EventEmitter<void>();

  currentStep = 1;
  farmPlots: FarmPlot[] = [];
  operationId: string | null = null;

  loadingFarmPlots = false;
  isSaving = false;

  constructor(
    private farmPlotService: FarmPlotService,
    private crowdfundingService: FarmCrowdfundingService,
    private toastService: ToastService,
  ) {
  }

  ngOnInit(): void {
    this.loadFarmPlots();
  }

  onOperationSubmit(request: FarmOperationCreateRequest): void {
    this.isSaving = true;
    this.crowdfundingService.createOperation(request).subscribe({
      next: (op: ApiResponse<FarmOperation>) => {
        this.operationId = op.data ? op.data.id : null;
        this.currentStep = 2;
        this.isSaving = false;
      },
      error: (error) => {
        this.isSaving = false;
        this.toastService.error(error.message || 'Failed to create farm operation', 'Create Operation');
      },
    });
  }

  onCampaignSubmit(request: CrowdfundingCampaignCreateRequest): void {
    this.isSaving = true;
    this.crowdfundingService.createCampaign(request).subscribe({
      next: () => {
        this.currentStep = 3;
        this.isSaving = false;
      },
      error: (error) => {
        this.isSaving = false;
        this.toastService.error(error.message || 'Failed to create campaign', 'Create Campaign');
      },
    });
  }

  onConfirm(): void {
    this.toastService.success('Campaign created successfully');
    this.onCompleted();
    this.campaignCreated.emit();
  }

  onCompleted(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.currentStep = 1;
    this.operationId = null;
  }

  private loadFarmPlots(): void {
    this.loadingFarmPlots = true;
    const filterRequest: FarmPlotFilterRequest = {
      searchText: undefined,
      statuses: ['ACTIVE'],
      soilTypes: undefined,
      sizeTypes: undefined,
      sortBy: 'title',
      sortDirection: 'ASC',
      page: 0,
      size: 1000,
    };

    this.farmPlotService.filterFarmPlots(filterRequest).subscribe({
      next: (response) => {
        this.farmPlots = response.content;
        this.loadingFarmPlots = false;
      },
      error: (error) => {
        this.loadingFarmPlots = false;
        this.toastService.error(error.message || 'Failed to fetch farm plots', 'Load Farm Plots');
      },
    });
  }
}

