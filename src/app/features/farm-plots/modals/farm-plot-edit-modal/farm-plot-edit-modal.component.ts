import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {FarmPlotFormComponent} from '../../components/farm-plot-form/farm-plot-form.component';
import {FarmPlot, FarmPlotRequest} from '../../models/farm-plot.model';
import {FarmPlotService} from '../../services/farm-plot.service';
import {ToastService} from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-farm-plot-edit-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, FarmPlotFormComponent],
  templateUrl: './farm-plot-edit-modal.component.html',
})
export class FarmPlotEditModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() farmPlot: FarmPlot | null = null;
  @Output() farmPlotUpdated = new EventEmitter<void>();

  @ViewChild('farmPlotForm') farmPlotForm!: FarmPlotFormComponent;

  isLoading = false;

  constructor(
    private farmPlotService: FarmPlotService,
    private toastService: ToastService
  ) {}

  onSubmit(): void {
    if (!this.farmPlotForm.isValid()) {
      this.farmPlotForm.markAllAsTouched();
      return;
    }
    if (!this.farmPlot) {
      return;
    }

    this.isLoading = true;
    const request: FarmPlotRequest = this.farmPlotForm.getValue();

    this.farmPlotService.updateFarmPlot(this.farmPlot.id, request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.toastService.success('Farm plot updated successfully');
        this.farmPlotUpdated.emit();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(error.message || 'Failed to update farm plot', 'Update Farm Plot');
      },
    });
  }

  onCancel(): void {
    this.farmPlotForm.reset();
  }
}

