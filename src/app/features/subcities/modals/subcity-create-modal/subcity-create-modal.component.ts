import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {SubcityFormComponent} from '../../components/subcity-form/subcity-form.component';
import {SubcityRequest} from '../../models/subcity.model';
import {SubcityService} from '../../services/subcity.service';
import {ToastService} from '../../../../shared/toast/toast.service';
import {RegionService} from '../../../regions/services/region.service';
import {Region} from '../../../regions/models/region.model';

@Component({
  selector: 'app-subcity-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, SubcityFormComponent],
  templateUrl: './subcity-create-modal.component.html'
})
export class SubcityCreateModalComponent implements OnInit {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() subcityCreated = new EventEmitter<void>();

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
    if (!this.subcityForm.isValid()) {
      this.subcityForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const request: SubcityRequest = this.subcityForm.getValue();

    this.subcityService.createSubcity(request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.subcityForm.reset();
        this.toastService.success(`Subcity/Zone created successfully`);
        this.subcityCreated.emit();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(
          error.message || 'Failed to create subcity/zone',
          'Create Subcity/Zone'
        );
      }
    });
  }

  onCancel(): void {
    this.subcityForm.reset();
  }
}

