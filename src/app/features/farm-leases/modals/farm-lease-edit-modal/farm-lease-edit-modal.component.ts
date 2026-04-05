import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {LeaseAgreement, LeaseCreateRequest, LeaseDefineTermsRequest} from '../../models/farm-lease.model';
import {FarmLeaseService} from '../../services/farm-lease.service';
import {FarmPlotService} from '../../../farm-plots/services/farm-plot.service';
import {FarmPlot, FarmPlotFilterRequest} from '../../../farm-plots/models/farm-plot.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {Workflow} from "../../../workflows/models/workflow.model";
import {FarmLeaseFormComponent} from "../../components/farm-lease-form/farm-lease-form.component";
import {WorkflowFormComponent} from "../../../workflows/components/workflow-form/workflow-form.component";

@Component({
  selector: 'app-farm-lease-edit-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, WorkflowFormComponent, FarmLeaseFormComponent],
  templateUrl: './farm-lease-edit-modal.component.html',
})
export class FarmLeaseEditModalComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() lease: LeaseAgreement | null = null;
  @Output() leaseUpdated = new EventEmitter<void>();

  farmPlots: FarmPlot[] = [];

  @ViewChild('farmLeaseForm') farmLeaseForm!: FarmLeaseFormComponent;

  isLoading = false;

  constructor(
    private farmLeaseService: FarmLeaseService,
    private farmPlotService: FarmPlotService,
    private toastService: ToastService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.loadFarmPlots();
    }
  }

  onSubmit(): void {
    if (!this.farmLeaseForm.isValid() || !this.lease) {
      this.farmLeaseForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const request: LeaseCreateRequest = this.farmLeaseForm.getValue();

    this.farmLeaseService.update(this.lease.id!, request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.toastService.success(`Farm Lease updated successfully`);
        this.leaseUpdated.emit();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(
          error.message || 'Failed to update farm lease',
          'Update Workflow'
        );
      }
    });
  }

  onCancel(): void {
    // Form will reset to loaded workflow via binding on next open
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
