import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {FarmFollowUpFormComponent} from '../../components/farm-followup-form/farm-followup-form.component';
import {FarmFollowUpService} from '../../services/farm-followup.service';
import {ToastService} from '../../../../shared/toast/toast.service';
import {FarmFollowUpCreateRequest} from '../../models/farm-followup.model';

@Component({
  selector: 'app-farm-followup-create-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, FarmFollowUpFormComponent],
  templateUrl: './farm-followup-create-modal.component.html',
})
export class FarmFollowUpCreateModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() followUpCreated = new EventEmitter<void>();

  /** When provided, the form will lock to this externalId */
  @Input() externalId: string | null = null;

  @ViewChild('followUpForm') followUpForm!: FarmFollowUpFormComponent;

  isLoading = false;

  constructor(
    private farmFollowUpService: FarmFollowUpService,
    private toastService: ToastService,
  ) {}

  onSubmit(): void {
    if (!this.followUpForm.isValid()) {
      this.followUpForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const request: FarmFollowUpCreateRequest = this.followUpForm.getValue();

    this.farmFollowUpService.createFollowUp(request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.followUpForm.reset(this.externalId ?? undefined);
        this.toastService.success('Follow-up saved successfully');
        this.followUpCreated.emit();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(error.message || 'Failed to save follow-up', 'Create Follow Up');
      }
    });
  }

  onCancel(): void {
    this.followUpForm.reset(this.externalId ?? undefined);
  }
}

