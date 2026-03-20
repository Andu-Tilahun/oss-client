import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {OrganizationFormComponent} from '../../components/organization-form/organization-form.component';
import {Organization, OrganizationRequest} from '../../models/organization.model';
import {OrganizationService} from '../../services/organization.service';
import {ToastService} from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-organization-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, OrganizationFormComponent],
  templateUrl: './organization-edit-modal.component.html'
})
export class OrganizationEditModalComponent {
  @Input() visible = false;
  @Input() organization: Organization | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() organizationUpdated = new EventEmitter<void>();

  @ViewChild('organizationForm') organizationForm!: OrganizationFormComponent;

  isLoading = false;

  constructor(private organizationService: OrganizationService, private toastService: ToastService) {
  }

  onSubmit(): void {
    if (!this.organizationForm.isValid() || !this.organization) {
      this.organizationForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue: OrganizationRequest = this.organizationForm.getValue();

    this.organizationService.updateOrganization(this.organization.id, formValue).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.toastService.success(`Organization updated successfully`);
        this.organizationUpdated.emit();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(
          error.message || 'Failed to update organization',
          'Update Organization'
        );
      }
    });
  }

  onCancel(): void {
    // Form will reset to @Input organization via binding on next open
  }
}

