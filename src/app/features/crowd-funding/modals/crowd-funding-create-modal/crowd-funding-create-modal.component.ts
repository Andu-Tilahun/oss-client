import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {ToastService} from '../../../../shared/toast/toast.service';
import {FarmPlotService} from '../../../farm-plots/services/farm-plot.service';
import {FarmPlot, FarmPlotFilterRequest} from '../../../farm-plots/models/farm-plot.model';
import {CrowdFundingService} from '../../services/crowd-funding.service';
import {CrowdFundingCreateRequest} from '../../models/crowd-funding.model';
import {CrowdFundingFormComponent} from "../../components/crowd-funding-form/crowd-funding-form.component";

@Component({
  selector: 'app-crowd-funding-create-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, CrowdFundingFormComponent],
  templateUrl: './crowd-funding-create-modal.component.html',
})
export class CrowdFundingCreateModalComponent implements OnInit {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() crowdFundingCreated = new EventEmitter<void>();

  @ViewChild('crowdFundingForm') crowdFundingForm!: CrowdFundingFormComponent;

  farmPlots: FarmPlot[] = [];
  isLoading = false;


  constructor(
    private farmPlotService: FarmPlotService,
    private crowdfundingService: CrowdFundingService,
    private toastService: ToastService,
  ) {
  }

  ngOnInit(): void {
    this.loadFarmPlots();
  }

  onSubmit(): void {
    if (!this.crowdFundingForm.isValid()) {
      this.crowdFundingForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    const request: CrowdFundingCreateRequest = this.crowdFundingForm.getValue();
    this.crowdfundingService.create(request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.crowdFundingForm.form.reset();
        this.toastService.success('Crowdfunding created successfully');
        this.crowdFundingCreated.emit();
        this.loadFarmPlots();
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(err.message || 'Failed to create crowd funding', 'Create Crowdfunding');
      },
    });
  }

  onCancel(): void {
    this.crowdFundingForm.form.reset();
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
      size: 1000,
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
}

