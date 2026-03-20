import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../shared/modals/modal/modal.component';
import { DepartmentFormComponent } from '../../components/department-form/department-form.component';
import { Department, DepartmentRequest } from '../../models/department.model';
import { DepartmentService } from '../../services/department.service';
import { ToastService } from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-department-edit-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, DepartmentFormComponent],
  templateUrl: './department-edit-modal.component.html',
})
export class DepartmentEditModalComponent {
  @Input() visible = false;
  @Input() department: Department | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() departmentUpdated = new EventEmitter<void>();

  @ViewChild(DepartmentFormComponent) form!: DepartmentFormComponent;

  isLoading = false;

  constructor(
    private departmentService: DepartmentService,
    private toastService: ToastService
  ) {}

  onSubmit(): void {
    if (!this.form.isValid() || !this.department) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    const request: DepartmentRequest = this.form.getValue();
    this.departmentService.update(this.department.id, request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.toastService.success('Department updated successfully');
        this.departmentUpdated.emit();
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(err.message || 'Failed to update department', 'Update Department');
      },
    });
  }

  onCancel(): void {}
}
