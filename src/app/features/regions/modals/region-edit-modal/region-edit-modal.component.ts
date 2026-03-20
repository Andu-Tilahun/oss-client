import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {RegionFormComponent} from '../../components/region-form/region-form.component';
import {Region, RegionRequest} from '../../models/region.model';
import {RegionService} from '../../services/region.service';
import {ToastService} from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-region-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, RegionFormComponent],
  templateUrl: './region-edit-modal.component.html'
})
export class RegionEditModalComponent {
  @Input() visible = false;
  @Input() region: Region | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() regionUpdated = new EventEmitter<void>();

  @ViewChild('regionForm') regionForm!: RegionFormComponent;

  isLoading = false;

  constructor(private regionService: RegionService, private toastService: ToastService) {
  }

  onSubmit(): void {
    if (!this.regionForm.isValid() || !this.region) {
      this.regionForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue: RegionRequest = this.regionForm.getValue();

    this.regionService.updateRegion(this.region.id, formValue).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.toastService.success(`Region updated successfully`);
        this.regionUpdated.emit();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(
          error.message || 'Failed to update region',
          'Update Region'
        );
      }
    });
  }

  onCancel(): void {
    // Form will reset to @Input region via binding on next open
  }
}

