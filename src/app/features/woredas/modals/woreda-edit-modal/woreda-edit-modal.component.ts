import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {WoredaFormComponent} from '../../components/woreda-form/woreda-form.component';
import {Woreda, WoredaRequest} from '../../models/woreda.model';
import {WoredaService} from '../../services/woreda.service';
import {ToastService} from '../../../../shared/toast/toast.service';
import {SubcityService} from '../../../subcities/services/subcity.service';
import {Subcity} from '../../../subcities/models/subcity.model';

@Component({
  selector: 'app-woreda-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, WoredaFormComponent],
  templateUrl: './woreda-edit-modal.component.html'
})
export class WoredaEditModalComponent implements OnInit {
  @Input() visible = false;
  @Input() woreda: Woreda | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() woredaUpdated = new EventEmitter<void>();

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
      error: () => {}
    });
  }

  onSubmit(): void {
    if (this.isLoading) {
      return; // a request is already in flight (e.g. Enter pressed again)
    }
    if (!this.woredaForm.isValid() || !this.woreda) {
      this.woredaForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue: WoredaRequest = this.woredaForm.getValue();

    this.woredaService.updateWoreda(this.woreda.id, formValue).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.toastService.success(`Woreda updated successfully`);
        this.woredaUpdated.emit();
      },
      error: (error) => {
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    // Form will reset to @Input woreda via binding on next open
  }
}

