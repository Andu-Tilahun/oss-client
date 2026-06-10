import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {ToastService} from '../../../../shared/toast/toast.service';
import {FarmPlotService} from '../../../farm-plots/services/farm-plot.service';
import {FarmPlot, FarmPlotFilterRequest} from '../../../farm-plots/models/farm-plot.model';
import {InvestmentPackageService} from '../../services/investment-package.service';
import {InvestmentPackage, InvestmentPackageCreateRequest} from '../../models/investment-package.model';
import {InvestmentPackageFormComponent} from '../../components/investment-package-form/investment-package-form.component';

@Component({
  selector: 'app-investment-package-edit-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, InvestmentPackageFormComponent],
  templateUrl: './investment-package-edit-modal.component.html',
})
export class InvestmentPackageEditModalComponent implements OnInit {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() investmentPackage: InvestmentPackage | null = null;
  @Output() investmentPackageUpdated = new EventEmitter<void>();

  @ViewChild('investmentPackageForm') investmentPackageForm!: InvestmentPackageFormComponent;

  farmPlots: FarmPlot[] = [];
  isLoading = false;

  constructor(
    private farmPlotService: FarmPlotService,
    private investmentPackageService: InvestmentPackageService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadFarmPlots();
  }

  onSubmit(): void {
    if (!this.investmentPackage) return;
    if (!this.investmentPackageForm.isValid()) {
      this.investmentPackageForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const request: InvestmentPackageCreateRequest = this.investmentPackageForm.getValue();

    this.investmentPackageService.updateInvestmentPackage(this.investmentPackage.id, request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.toastService.success('Investment Package updated successfully');
        this.investmentPackageUpdated.emit();
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(err.message || 'Failed to update crowd funding', 'Update Investment Package');
      },
    });
  }

  onCancel(): void {
    this.investmentPackageForm.reset();
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

