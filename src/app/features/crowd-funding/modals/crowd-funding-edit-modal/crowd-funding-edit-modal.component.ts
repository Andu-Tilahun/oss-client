import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {ToastService} from '../../../../shared/toast/toast.service';
import {FarmPlotService} from '../../../farm-plots/services/farm-plot.service';
import {FarmPlot, FarmPlotFilterRequest} from '../../../farm-plots/models/farm-plot.model';
import {CrowdFundingService} from '../../services/crowd-funding.service';
import {CrowdFunding, CrowdFundingCreateRequest} from '../../models/crowd-funding.model';
import {CrowdFundingFormComponent} from '../../components/crowd-funding-form/crowd-funding-form.component';

@Component({
  selector: 'app-crowd-funding-edit-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, CrowdFundingFormComponent],
  templateUrl: './crowd-funding-edit-modal.component.html',
})
export class CrowdFundingEditModalComponent implements OnInit {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() crowdFunding: CrowdFunding | null = null;
  @Output() crowdFundingUpdated = new EventEmitter<void>();

  @ViewChild('crowdFundingForm') crowdFundingForm!: CrowdFundingFormComponent;

  farmPlots: FarmPlot[] = [];
  isLoading = false;

  constructor(
    private farmPlotService: FarmPlotService,
    private crowdfundingService: CrowdFundingService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadFarmPlots();
  }

  onSubmit(): void {
    if (!this.crowdFunding) return;
    if (!this.crowdFundingForm.isValid()) {
      this.crowdFundingForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const request: CrowdFundingCreateRequest = this.crowdFundingForm.getValue();

    this.crowdfundingService.updatecrowdFunding(this.crowdFunding.id, request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.toastService.success('Crowdfunding updated successfully');
        this.crowdFundingUpdated.emit();
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(err.message || 'Failed to update crowd funding', 'Update Crowdfunding');
      },
    });
  }

  onCancel(): void {
    this.crowdFundingForm.reset();
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

