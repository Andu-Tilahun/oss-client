import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {OrganizationFormComponent} from '../../components/organization-form/organization-form.component';
import {OrganizationRequest} from '../../models/organization.model';
import {OrganizationService} from '../../services/organization.service';
import {ToastService} from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-organization-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, OrganizationFormComponent],
  templateUrl: './organization-create-modal.component.html'
})
export class OrganizationCreateModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() organizationCreated = new EventEmitter<void>();

  @ViewChild('organizationForm') organizationForm!: OrganizationFormComponent;

  isLoading = false;

  constructor(private organizationService: OrganizationService, private toastService: ToastService) {
  }

  onSubmit(): void {
    if (!this.organizationForm.isValid()) {
      this.organizationForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const request: OrganizationRequest = this.organizationForm.getValue();

    this.organizationService.createOrganization(request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.organizationForm.reset();
        this.toastService.success(`Organization created successfully`);
        this.organizationCreated.emit();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(
          error.message || 'Failed to create organization',
          'Create Organization'
        );
      }
    });
  }

  onCancel(): void {
    this.organizationForm.reset();
  }
}

