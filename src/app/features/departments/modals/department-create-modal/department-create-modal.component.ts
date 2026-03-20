import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../shared/modals/modal/modal.component';
import { DepartmentFormComponent } from '../../components/department-form/department-form.component';
import { DepartmentRequest } from '../../models/department.model';
import { DepartmentService } from '../../services/department.service';
import { ToastService } from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-department-create-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, DepartmentFormComponent],
  templateUrl: './department-create-modal.component.html',
})
export class DepartmentCreateModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() departmentCreated = new EventEmitter<void>();

  @ViewChild(DepartmentFormComponent) form!: DepartmentFormComponent;

  isLoading = false;

  constructor(
    private departmentService: DepartmentService,
    private toastService: ToastService
  ) {}

  onSubmit(): void {
    if (!this.form.isValid()) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    const request: DepartmentRequest = this.form.getValue();
    this.departmentService.create(request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.form.reset();
        this.toastService.success('Department created successfully');
        this.departmentCreated.emit();
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(err.message || 'Failed to create department', 'Create Department');
      },
    });
  }

  onCancel(): void {
    this.form.reset();
  }
}
