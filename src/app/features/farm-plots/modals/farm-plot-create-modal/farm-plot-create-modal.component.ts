import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {forkJoin, of} from 'rxjs';
import {switchMap} from 'rxjs/operators';
import {MultiStepFormModalComponent} from '../../../../shared/modals/multi-step-form-modal/multi-step-form-modal.component';
import {StepConfig} from '../../../../shared/components/stepper/stepper.component';
import {FarmPlotCreateWizardComponent} from '../../components/farm-plot-create-wizard/farm-plot-create-wizard.component';
import {FarmPlotRequest} from '../../models/farm-plot.model';
import {FarmPlotService} from '../../services/farm-plot.service';
import {ToastService} from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-farm-plot-create-modal',
  standalone: true,
  imports: [CommonModule, MultiStepFormModalComponent, FarmPlotCreateWizardComponent],
  templateUrl: './farm-plot-create-modal.component.html',
})
export class FarmPlotCreateModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() farmPlotCreated = new EventEmitter<void>();

  @ViewChild('wizard') wizard!: FarmPlotCreateWizardComponent;

  currentStep = 1;
  isLoading = false;

  readonly steps: StepConfig[] = [
    {label: 'Basic Info', description: 'Title, description & size', clickable: true},
    {label: 'Location & Soil', description: 'Coordinates, soil & region', clickable: true},
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

    this.isLoading = true;

    this.wizard.uploadPendingMainImage().pipe(
      switchMap((imageUuid) => {
        const request: FarmPlotRequest = {
          ...this.wizard.getValue(),
          imageUuid: imageUuid ?? '',
        };
        return this.farmPlotService.createFarmPlot(request);
      }),
    ).subscribe({
      next: (createdPlot) => {
        const galleryImageUuids = this.wizard.getGalleryImageUuids();
        const createGalleryCalls = galleryImageUuids.map((imageUuid) =>
          this.farmPlotService.addFarmPlotGalleryImage(createdPlot.id, {imageUuid}),
        );
        const syncGallery$ = createGalleryCalls.length ? forkJoin(createGalleryCalls) : of([]);

        syncGallery$.subscribe({
          next: () => {
            this.isLoading = false;
            this.visible = false;
            this.visibleChange.emit(false);
            this.resetWizardState();
            this.toastService.success('Farm plot created successfully');
            this.farmPlotCreated.emit();
          },
          error: (galleryError) => {
            this.isLoading = false;
            this.toastService.error(galleryError.message || 'Farm plot created, but gallery upload failed', 'Create Farm Plot Gallery');
          },
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(error.message || 'Failed to create farm plot', 'Create Farm Plot');
      },
    });
  }

  onCancelled(): void {
    this.resetWizardState();
  }

  private resetWizardState(): void {
    this.currentStep = 1;
    this.wizard.reset();
  }
}
