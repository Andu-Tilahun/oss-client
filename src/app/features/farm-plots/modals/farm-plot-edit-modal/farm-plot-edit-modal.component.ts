import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {forkJoin, of} from 'rxjs';
import {MultiStepFormModalComponent} from '../../../../shared/modals/multi-step-form-modal/multi-step-form-modal.component';
import {StepConfig} from '../../../../shared/components/stepper/stepper.component';
import {FarmPlotEditWizardComponent} from '../../components/farm-plot-edit-wizard/farm-plot-edit-wizard.component';
import {FarmPlot, FarmPlotRequest} from '../../models/farm-plot.model';
import {FarmPlotService} from '../../services/farm-plot.service';
import {ToastService} from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-farm-plot-edit-modal',
  standalone: true,
  imports: [CommonModule, MultiStepFormModalComponent, FarmPlotEditWizardComponent],
  templateUrl: './farm-plot-edit-modal.component.html',
})
export class FarmPlotEditModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() farmPlot: FarmPlot | null = null;
  @Output() farmPlotUpdated = new EventEmitter<void>();

  @ViewChild('wizard') wizard!: FarmPlotEditWizardComponent;

  currentStep = 1;
  isLoading = false;

  readonly steps: StepConfig[] = [
    {label: 'Basic Info', description: 'Title, description & size', clickable: true},
    {label: 'Location & Soil', description: 'Coordinates, soil, status & region', clickable: true},
    {label: 'Images', description: 'Plot & gallery photos', clickable: true},
  ];

  constructor(
    private farmPlotService: FarmPlotService,
    private toastService: ToastService,
  ) {}

  onNext(): void {
    if (this.wizard.isStepValid(this.currentStep)) {
      this.currentStep++;
    } else {
      this.wizard.markStepTouched(this.currentStep);
    }
  }

  onSubmit(): void {
    for (const step of [1, 2, 3]) {
      if (!this.wizard.isStepValid(step)) {
        this.currentStep = step;
        this.wizard.markStepTouched(step);
        return;
      }
    }
    if (!this.farmPlot) {
      return;
    }

    this.isLoading = true;
    const request: FarmPlotRequest = this.wizard.getValue();

    this.farmPlotService.updateFarmPlot(this.farmPlot.id, request).subscribe({
      next: (updatedPlot) => {
        const desiredImageUuids = this.wizard.getGalleryImageUuids();

        this.farmPlotService.getFarmPlotGallery(updatedPlot.id).subscribe({
          next: (existingGallery) => {
            const existingMap = new Map(existingGallery.map((item) => [item.imageUuid, item]));
            const desiredSet = new Set(desiredImageUuids);

            const addCalls = desiredImageUuids
              .filter((imageUuid) => !existingMap.has(imageUuid))
              .map((imageUuid) => this.farmPlotService.addFarmPlotGalleryImage(updatedPlot.id, {imageUuid}));

            const removeCalls = existingGallery
              .filter((item) => !desiredSet.has(item.imageUuid))
              .map((item) => this.farmPlotService.deleteFarmPlotGalleryImage(updatedPlot.id, item.id));

            const syncCalls = [...addCalls, ...removeCalls];
            const syncGallery$ = syncCalls.length ? forkJoin(syncCalls) : of([]);

            syncGallery$.subscribe({
              next: () => {
                this.isLoading = false;
                this.visible = false;
                this.visibleChange.emit(false);
                this.currentStep = 1;
                this.toastService.success('Farm plot updated successfully');
                this.farmPlotUpdated.emit();
              },
              error: (galleryError) => {
                this.isLoading = false;
                this.toastService.error(galleryError.message || 'Farm plot updated, but gallery sync failed', 'Update Farm Plot Gallery');
              },
            });
          },
          error: (galleryError) => {
            this.isLoading = false;
            this.toastService.error(galleryError.message || 'Failed to load existing gallery', 'Update Farm Plot');
          },
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(error.message || 'Failed to update farm plot', 'Update Farm Plot');
      },
    });
  }

  onCancelled(): void {
    this.currentStep = 1;
    this.wizard.reset();
  }
}
