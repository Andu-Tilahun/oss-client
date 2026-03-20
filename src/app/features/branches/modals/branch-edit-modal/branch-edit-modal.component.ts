import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {BranchFormComponent} from '../../components/branch-form/branch-form.component';
import {Branch, BranchRequest} from '../../models/branch.model';
import {BranchService} from '../../services/branch.service';
import {ToastService} from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-branch-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, BranchFormComponent],
  templateUrl: './branch-edit-modal.component.html'
})
export class BranchEditModalComponent {
  @Input() visible = false;
  @Input() branch: Branch | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() branchUpdated = new EventEmitter<void>();

  @ViewChild('branchForm') branchForm!: BranchFormComponent;

  isLoading = false;

  constructor(private branchService: BranchService, private toastService: ToastService) {
  }

  onSubmit(): void {
    if (!this.branchForm || !this.branchForm.form.valid || !this.branch) {
      this.branchForm?.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const request: BranchRequest = this.branchForm.form.value;

    this.branchService.updateBranch(this.branch.id, request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.toastService.success('Branch updated successfully');
        this.branchUpdated.emit();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(
          error.message || 'Failed to update branch',
          'Update Branch'
        );
      }
    });
  }

  onCancel(): void {
    // form will reset to @Input branch via binding next time
  }
}

