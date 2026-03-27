import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {ToastService} from '../../../../shared/toast/toast.service';
import {
  LeaseRegistrationStepperComponent
} from '../../components/lease-registration-stepper/lease-registration-stepper.component';
import {FarmPlotService} from '../../../farm-plots/services/farm-plot.service';
import {FarmPlot, FarmPlotFilterRequest} from '../../../farm-plots/models/farm-plot.model';
import {FarmLeaseService} from '../../services/farm-lease.service';
import {LeaseAgreement, LeaseCreateRequest, LeaseDefineTermsRequest} from '../../models/farm-lease.model';
import {ApiResponse} from "../../../../shared/models/api-response.model";

@Component({
  selector: 'app-farm-lease-create-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, LeaseRegistrationStepperComponent],
  templateUrl: './farm-lease-create-modal.component.html',
})
export class FarmLeaseCreateModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() leaseCreated = new EventEmitter<void>();

  currentStep = 1;
  farmPlots: FarmPlot[] = [];
  leaseId: string | undefined;

  loadingFarmPlots = false;
  isSaving = false;

  constructor(
    private farmPlotService: FarmPlotService,
    private farmLeaseService: FarmLeaseService,
    private toastService: ToastService
  ) {
  }

  ngOnInit(): void {
    this.loadFarmPlots();
  }

  onLeaseDetailsSubmit(request: LeaseCreateRequest): void {
    this.isSaving = true;
    this.farmLeaseService.createLease(request).subscribe({
      next: (lease: ApiResponse<LeaseAgreement>) => {
        // HttpService unwraps ApiResponse.data
        this.leaseId = lease.data?.id;
        this.currentStep = 2;
        this.isSaving = false;
      },
      error: (error) => {
        this.isSaving = false;
        this.toastService.error(error.message || 'Failed to create lease', 'Create Lease');
      },
    });
  }

  onPaymentSubmit(request: LeaseDefineTermsRequest): void {
    if (!this.leaseId) return;
    this.isSaving = true;
    this.farmLeaseService.defineCustomTerms(this.leaseId, request).subscribe({
      next: (lease) => {
        this.currentStep = 3;
        this.isSaving = false;
      },
      error: (error) => {
        this.isSaving = false;
        this.toastService.error(error.message || 'Failed to generate terms', 'Generate Terms');
      },
    });
  }

  onConfirm(): void {
    if (!this.leaseId) return;
    this.isSaving = true;
    this.farmLeaseService.confirmLease(this.leaseId).subscribe({
      next: () => {
        this.isSaving = false;
        this.toastService.success('Lease activated successfully');
        this.onCompleted();
        this.leaseCreated.emit();
      },
      error: (error) => {
        this.isSaving = false;
        this.toastService.error(error.message || 'Failed to confirm lease', 'Confirm Lease');
      },
    });
  }

  onCompleted(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.currentStep = 1;
    this.leaseId = undefined;
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

