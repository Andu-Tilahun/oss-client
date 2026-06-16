import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {ToastService} from '../../../../shared/toast/toast.service';
import {FarmPlotService} from '../../../farm-plots/services/farm-plot.service';
import {FarmPlot, FarmPlotFilterRequest} from '../../../farm-plots/models/farm-plot.model';
import {InvestmentPackageTypeService} from '../../services/investment-package-type.service';
import {InvestmentPackageTypeCreateRequest} from '../../models/investment-package-type.model';
import {InvestmentPackageTypeFormComponent} from "../../components/investment-package-type-form/investment-package-type-form.component";

@Component({
  selector: 'app-investment-package-type-create-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, InvestmentPackageTypeFormComponent],
  templateUrl: './investment-package-type-create-modal.component.html',
})
export class InvestmentPackageTypeCreateModalComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() packageTypeCreated = new EventEmitter<void>();

  /**
   * Optional: when investor picked a plot from cards, we pre-fill the form
   * and hide the combobox.
   */
  @Input() selectedFarmPlot: FarmPlot | null = null;

  @ViewChild('investmentPackageTypeForm') investmentPackageTypeForm!: InvestmentPackageTypeFormComponent;

  isLoading = false;

  farmPlots: FarmPlot[] = [];

  constructor(
    private farmPlotService: FarmPlotService,
    private investmentPackageTypeService: InvestmentPackageTypeService,
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
    if (!this.investmentPackageTypeForm.isValid()) {
      this.investmentPackageTypeForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const request: InvestmentPackageTypeCreateRequest = this.investmentPackageTypeForm.getValue();

    this.investmentPackageTypeService.create(request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.investmentPackageTypeForm.reset();
        this.toastService.success(`Investment package type created successfully`);
        this.packageTypeCreated.emit();
        this.loadFarmPlots();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(
          error.message || 'Failed to create investment package type',
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
