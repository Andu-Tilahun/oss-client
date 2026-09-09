import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {
  InvestmentPackageTypeAgreement,
  InvestmentPackageTypeCreateRequest,
} from '../../models/investment-package-type.model';
import {InvestmentPackageTypeService} from '../../services/investment-package-type.service';
import {FarmPlotService} from '../../../farm-plots/services/farm-plot.service';
import {FarmPlot, FarmPlotFilterRequest} from '../../../farm-plots/models/farm-plot.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {InvestmentPackageTypeFormComponent} from "../../components/investment-package-type-form/investment-package-type-form.component";
import {WorkflowFormComponent} from "../../../workflows/components/workflow-form/workflow-form.component";

@Component({
  selector: 'app-investment-package-type-edit-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, WorkflowFormComponent, InvestmentPackageTypeFormComponent],
  templateUrl: './investment-package-type-edit-modal.component.html',
})
export class InvestmentPackageTypeEditModalComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() agreement: InvestmentPackageTypeAgreement | null = null;
  @Output() packageTypeUpdated = new EventEmitter<void>();

  farmPlots: FarmPlot[] = [];

  @ViewChild('investmentPackageTypeForm') investmentPackageTypeForm!: InvestmentPackageTypeFormComponent;

  isLoading = false;

  constructor(
    private investmentPackageTypeService: InvestmentPackageTypeService,
    private farmPlotService: FarmPlotService,
    private toastService: ToastService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.loadFarmPlots();
    }
  }

  onSubmit(): void {
    if (this.isLoading) {
      return; // a request is already in flight (e.g. Enter pressed again)
    }
    if (!this.investmentPackageTypeForm.isValid() || !this.agreement) {
      this.investmentPackageTypeForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const request: InvestmentPackageTypeCreateRequest = this.investmentPackageTypeForm.getValue();

    this.investmentPackageTypeService.update(this.agreement.id!, request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.toastService.success(`Investment package type updated successfully`);
        this.packageTypeUpdated.emit();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(
          error.message || 'Failed to update investment package type',
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
