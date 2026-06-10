import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {ToastService} from '../../../../shared/toast/toast.service';
import {FarmPlotService} from '../../../farm-plots/services/farm-plot.service';
import {FarmPlot, FarmPlotFilterRequest} from '../../../farm-plots/models/farm-plot.model';
import {InvestmentPackageService} from '../../services/investment-package.service';
import {InvestmentPackageCreateRequest} from '../../models/investment-package.model';
import {InvestmentPackageFormComponent} from "../../components/investment-package-form/investment-package-form.component";

@Component({
  selector: 'app-investment-package-create-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, InvestmentPackageFormComponent],
  templateUrl: './investment-package-create-modal.component.html',
})
export class InvestmentPackageCreateModalComponent implements OnInit {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() investmentPackageCreated = new EventEmitter<void>();

  @ViewChild('investmentPackageForm') investmentPackageForm!: InvestmentPackageFormComponent;

  farmPlots: FarmPlot[] = [];
  isLoading = false;


  constructor(
    private farmPlotService: FarmPlotService,
    private investmentPackageService: InvestmentPackageService,
    private toastService: ToastService,
  ) {
  }

  ngOnInit(): void {
    this.loadFarmPlots();
  }

  onSubmit(): void {
    if (!this.investmentPackageForm.isValid()) {
      this.investmentPackageForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    const request: InvestmentPackageCreateRequest = this.investmentPackageForm.getValue();
    this.investmentPackageService.create(request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.investmentPackageForm.reset();
        this.toastService.success('Investment Package created successfully');
        this.investmentPackageCreated.emit();
        this.loadFarmPlots();
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(err.message || 'Failed to create crowd funding', 'Create Investment Package');
      },
    });
  }

  onCancel(): void {
    this.investmentPackageForm.reset();
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

