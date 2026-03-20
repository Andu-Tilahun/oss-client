import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {WorkflowFormComponent} from '../../components/workflow-form/workflow-form.component';
import {Workflow} from '../../models/workflow.model';
import {WorkflowService} from '../../services/workflow.service';
import {ToastService} from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-workflow-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, WorkflowFormComponent],
  templateUrl: './workflow-create-modal.component.html'
})
export class WorkflowCreateModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() workflowCreated = new EventEmitter<void>();

  @ViewChild('workflowForm') workflowForm!: WorkflowFormComponent;

  isLoading = false;

  constructor(
    private workflowService: WorkflowService,
    private toastService: ToastService
  ) {
  }

  onSubmit(): void {
    if (!this.workflowForm.isValid()) {
      this.workflowForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const request: Workflow = this.workflowForm.getValue();

    this.workflowService.create(request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.workflowForm.reset();
        this.toastService.success(`Workflow created successfully`);
        this.workflowCreated.emit();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(
          error.message || 'Failed to create workflow',
          'Create Workflow'
        );
      }
    });
  }

  onCancel(): void {
    this.workflowForm.reset();
  }
}

