import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {BranchFormComponent} from '../../components/branch-form/branch-form.component';
import {BranchRequest} from '../../models/branch.model';
import {BranchService} from '../../services/branch.service';
import {ToastService} from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-branch-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, BranchFormComponent],
  templateUrl: './branch-create-modal.component.html'
})
export class BranchCreateModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() branchCreated = new EventEmitter<void>();

  @ViewChild('branchForm') branchForm!: BranchFormComponent;

  isLoading = false;

  constructor(private branchService: BranchService, private toastService: ToastService) {
  }

  onSubmit(): void {
    if (!this.branchForm || !this.branchForm.form.valid) {
      this.branchForm?.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const request: BranchRequest = this.branchForm.form.value;

    this.branchService.createBranch(request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.toastService.success('Branch created successfully');
        this.branchCreated.emit();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(
          error.message || 'Failed to create branch',
          'Create Branch'
        );
      }
    });
  }

  onCancel(): void {
    this.branchForm?.form.reset();
  }
}

