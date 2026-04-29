import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {ToastService} from '../../../../shared/toast/toast.service';
import {FarmPlotService} from '../../../farm-plots/services/farm-plot.service';
import {FarmPlot, FarmPlotFilterRequest} from '../../../farm-plots/models/farm-plot.model';
import {FarmLeaseService} from '../../services/farm-lease.service';
import {LeaseCreateRequest} from '../../models/farm-lease.model';
import {FarmLeaseFormComponent} from "../../components/farm-lease-form/farm-lease-form.component";

@Component({
  selector: 'app-farm-lease-create-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, FarmLeaseFormComponent],
  templateUrl: './farm-lease-create-modal.component.html',
})
export class FarmLeaseCreateModalComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() leaseCreated = new EventEmitter<void>();

  /**
   * Optional: when investor picked a plot from cards, we pre-fill the form
   * and hide the combobox.
   */
  @Input() selectedFarmPlot: FarmPlot | null = null;

  @ViewChild('farmLeaseForm') farmLeaseForm!: FarmLeaseFormComponent;

  isLoading = false;

  farmPlots: FarmPlot[] = [];

  constructor(
    private farmPlotService: FarmPlotService,
    private farmLeaseService: FarmLeaseService,
    private toastService: ToastService
  ) {
  }

  ngOnInit(): void {
    if (this.visible && !this.selectedFarmPlot) {
      this.loadFarmPlots();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      if (!this.selectedFarmPlot) {
        this.loadFarmPlots();
      } else {
        // We don't need the selector options when a plot is already chosen.
        this.farmPlots = [];
      }
    }
  }

  onSubmit(): void {
    if (!this.farmLeaseForm.isValid()) {
      this.farmLeaseForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const request: LeaseCreateRequest = this.farmLeaseForm.getValue();

    this.farmLeaseService.createLease(request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.farmLeaseForm.reset();
        this.toastService.success(`Farm Lease created successfully`);
        this.leaseCreated.emit();
        this.loadFarmPlots();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(
          error.message || 'Failed to create farm lease',
          'Create Workflow'
        );
      }
    });

  }


  private loadFarmPlots(): void {
    this.isLoading = true;
    const filterRequest: FarmPlotFilterRequest = {
      searchText: undefined,
      statuses: ['ACTIVE'],
      soilTypes: undefined,
      sizeTypes: undefined,
      sortBy: 'title',
      sortDirection: 'ASC',
      page: 0,
      size: 1000000000,
    };

    this.farmPlotService.filterFarmPlots(filterRequest).subscribe({
      next: (response) => {
        this.farmPlots = response.content;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(error.message || 'Failed to fetch farm plots', 'Load Farm Plots');
      },
    });
  }
  onCancel(): void {
    // Form will reset to loaded workflow via binding on next open
  }
}

