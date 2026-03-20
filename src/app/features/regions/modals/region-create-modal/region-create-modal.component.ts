import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {RegionFormComponent} from '../../components/region-form/region-form.component';
import {RegionRequest} from '../../models/region.model';
import {RegionService} from '../../services/region.service';
import {ToastService} from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-region-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, RegionFormComponent],
  templateUrl: './region-create-modal.component.html'
})
export class RegionCreateModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() regionCreated = new EventEmitter<void>();

  @ViewChild('regionForm') regionForm!: RegionFormComponent;

  isLoading = false;

  constructor(private regionService: RegionService, private toastService: ToastService) {
  }

  onSubmit(): void {
    if (!this.regionForm.isValid()) {
      this.regionForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const request: RegionRequest = this.regionForm.getValue();

    this.regionService.createRegion(request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.regionForm.reset();
        this.toastService.success(`Region created successfully`);
        this.regionCreated.emit();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(
          error.message || 'Failed to create region',
          'Create Region'
        );
      }
    });
  }

  onCancel(): void {
    this.regionForm.reset();
  }
}

