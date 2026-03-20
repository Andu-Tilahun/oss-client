import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {SubcityFormComponent} from '../../components/subcity-form/subcity-form.component';
import {Subcity, SubcityRequest} from '../../models/subcity.model';
import {SubcityService} from '../../services/subcity.service';
import {ToastService} from '../../../../shared/toast/toast.service';
import {RegionService} from '../../../regions/services/region.service';
import {Region} from '../../../regions/models/region.model';

@Component({
  selector: 'app-subcity-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, SubcityFormComponent],
  templateUrl: './subcity-edit-modal.component.html'
})
export class SubcityEditModalComponent implements OnInit {
  @Input() visible = false;
  @Input() subcity: Subcity | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() subcityUpdated = new EventEmitter<void>();

  @ViewChild('subcityForm') subcityForm!: SubcityFormComponent;

  isLoading = false;
  regions: Region[] = [];

  constructor(
    private subcityService: SubcityService,
    private regionService: RegionService,
    private toastService: ToastService
  ) {
  }

  ngOnInit(): void {
    this.loadRegions();
  }

  private loadRegions(): void {
    this.regionService.getAllRegions(0, 1000).subscribe({
      next: response => {
        this.regions = response.content;
      },
      error: error => {
        this.toastService.error(
          error.message || 'Failed to load regions',
          'Load Regions'
        );
      }
    });
  }

  onSubmit(): void {
    if (!this.subcityForm.isValid() || !this.subcity) {
      this.subcityForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue: SubcityRequest = this.subcityForm.getValue();

    this.subcityService.updateSubcity(this.subcity.id, formValue).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.toastService.success(`Subcity/Zone updated successfully`);
        this.subcityUpdated.emit();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(
          error.message || 'Failed to update subcity/zone',
          'Update Subcity/Zone'
        );
      }
    });
  }

  onCancel(): void {
    // Form will reset to @Input subcity via binding on next open
  }
}

