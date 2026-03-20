import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {FarmPlotFormComponent} from '../../components/farm-plot-form/farm-plot-form.component';
import {FarmPlotRequest} from '../../models/farm-plot.model';
import {FarmPlotService} from '../../services/farm-plot.service';
import {ToastService} from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-farm-plot-create-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, FarmPlotFormComponent],
  templateUrl: './farm-plot-create-modal.component.html',
})
export class FarmPlotCreateModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() farmPlotCreated = new EventEmitter<void>();

  @ViewChild('farmPlotForm') farmPlotForm!: FarmPlotFormComponent;

  isLoading = false;

  constructor(
    private farmPlotService: FarmPlotService,
    private toastService: ToastService,
  ) {}

  onSubmit(): void {
    if (!this.farmPlotForm.isValid()) {
      this.farmPlotForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const request: FarmPlotRequest = this.farmPlotForm.getValue();

    this.farmPlotService.createFarmPlot(request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.farmPlotForm.reset();
        this.toastService.success('Farm plot created successfully');
        this.farmPlotCreated.emit();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(error.message || 'Failed to create farm plot', 'Create Farm Plot');
      },
    });
  }

  onCancel(): void {
    this.farmPlotForm.reset();
  }
}
