import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {WorkflowFormComponent} from '../../components/workflow-form/workflow-form.component';
import {Workflow} from '../../models/workflow.model';
import {WorkflowService} from '../../services/workflow.service';
import {ToastService} from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-workflow-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, WorkflowFormComponent],
  templateUrl: './workflow-edit-modal.component.html'
})
export class WorkflowEditModalComponent {
  @Input() visible = false;
  @Input() workflow: Workflow | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() workflowUpdated = new EventEmitter<void>();

  @ViewChild('workflowForm') workflowForm!: WorkflowFormComponent;

  isLoading = false;

  constructor(
    private workflowService: WorkflowService,
    private toastService: ToastService
  ) {
  }

  onSubmit(): void {
    if (!this.workflowForm.isValid() || !this.workflow) {
      this.workflowForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const request: Workflow = this.workflowForm.getValue();

    this.workflowService.update(this.workflow.id!, request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.toastService.success(`Workflow updated successfully`);
        this.workflowUpdated.emit();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(
          error.message || 'Failed to update workflow',
          'Update Workflow'
        );
      }
    });
  }

  onCancel(): void {
    // Form will reset to loaded workflow via binding on next open
  }
}

