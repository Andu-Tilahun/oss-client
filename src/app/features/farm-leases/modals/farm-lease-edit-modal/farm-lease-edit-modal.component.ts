import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {LeaseAgreement, LeaseCreateRequest, LeaseDefineTermsRequest} from '../../models/farm-lease.model';
import {FarmLeaseService} from '../../services/farm-lease.service';
import {FarmPlotService} from '../../../farm-plots/services/farm-plot.service';
import {FarmPlot, FarmPlotFilterRequest} from '../../../farm-plots/models/farm-plot.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {
  LeaseRegistrationStepperComponent,
} from '../../components/lease-registration-stepper/lease-registration-stepper.component';

@Component({
  selector: 'app-farm-lease-edit-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, LeaseRegistrationStepperComponent],
  templateUrl: './farm-lease-edit-modal.component.html',
})
export class FarmLeaseEditModalComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() lease: LeaseAgreement | null = null;
  @Output() leaseUpdated = new EventEmitter<void>();

  currentStep = 1;

  farmPlots: FarmPlot[] = [];
  isSaving = false;

  constructor(
    private farmLeaseService: FarmLeaseService,
    private farmPlotService: FarmPlotService,
    private toastService: ToastService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.loadFarmPlots();
      this.currentStep = 1;
    }
    if (changes['visible']?.currentValue === false) {
      this.currentStep = 1;
    }
  }

  onLeaseDetailsSubmit(request: LeaseCreateRequest): void {
    if (!this.lease || this.lease.status !== 'PENDING') return;

    this.isSaving = true;
    this.farmLeaseService.updateLease(this.lease.id, request).subscribe({
      next: () => {
        this.currentStep = 2;
        this.isSaving = false;
      },
      error: (error) => {
        this.isSaving = false;
        this.toastService.error(error.message || 'Failed to update lease', 'Update Lease');
      },
    });
  }

  onPaymentSubmit(request: LeaseDefineTermsRequest): void {
    if (!this.lease) return;

    this.isSaving = true;
    this.farmLeaseService.defineCustomTerms(this.lease.id, request).subscribe({
      next: () => {
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
    if (!this.lease) return;

    this.isSaving = true;
    this.farmLeaseService.confirmLease(this.lease.id).subscribe({
      next: () => {
        this.isSaving = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.toastService.success('Lease activated successfully');
        this.leaseUpdated.emit();
      },
      error: (error) => {
        this.isSaving = false;
        this.toastService.error(error.message || 'Failed to confirm lease', 'Confirm Lease');
      },
    });
  }

  private loadFarmPlots(): void {
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
      },
      error: (error) => {
        this.toastService.error(error.message || 'Failed to fetch farm plots', 'Load Farm Plots');
      },
    });
  }
}
