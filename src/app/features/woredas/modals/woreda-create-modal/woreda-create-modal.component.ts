import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {WoredaFormComponent} from '../../components/woreda-form/woreda-form.component';
import {WoredaRequest} from '../../models/woreda.model';
import {WoredaService} from '../../services/woreda.service';
import {ToastService} from '../../../../shared/toast/toast.service';
import {SubcityService} from '../../../subcities/services/subcity.service';
import {Subcity} from '../../../subcities/models/subcity.model';

@Component({
  selector: 'app-woreda-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, WoredaFormComponent],
  templateUrl: './woreda-create-modal.component.html'
})
export class WoredaCreateModalComponent implements OnInit {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() woredaCreated = new EventEmitter<void>();

  @ViewChild('woredaForm') woredaForm!: WoredaFormComponent;

  isLoading = false;
  subcities: Subcity[] = [];

  constructor(
    private woredaService: WoredaService,
    private subcityService: SubcityService,
    private toastService: ToastService
  ) {
  }

  ngOnInit(): void {
    this.loadSubcities();
  }

  private loadSubcities(): void {
    this.subcityService.getAllSubcities(0, 1000).subscribe({
      next: response => {
        this.subcities = response.content;
      },
      error: error => {
        this.toastService.error(
          error.message || 'Failed to load subcities/zones',
          'Load Subcities/Zones'
        );
      }
    });
  }

  onSubmit(): void {
    if (!this.woredaForm.isValid()) {
      this.woredaForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const request: WoredaRequest = this.woredaForm.getValue();

    this.woredaService.createWoreda(request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.woredaForm.reset();
        this.toastService.success(`Woreda created successfully`);
        this.woredaCreated.emit();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(
          error.message || 'Failed to create woreda',
          'Create Woreda'
        );
      }
    });
  }

  onCancel(): void {
    this.woredaForm.reset();
  }
}

