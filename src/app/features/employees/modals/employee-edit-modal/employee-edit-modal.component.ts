import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/modals/modal/modal.component';
import { EmployeeFormComponent } from '../../components/employee-form/employee-form.component';
import { Employee, EmployeeRequest } from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';
import { ToastService } from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-employee-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, EmployeeFormComponent],
  templateUrl: './employee-edit-modal.component.html',
})
export class EmployeeEditModalComponent {
  @Input() visible = false;
  @Input() employee: Employee | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() employeeUpdated = new EventEmitter<void>();

  @ViewChild('employeeForm') employeeForm!: EmployeeFormComponent;

  isLoading = false;

  constructor(
    private employeeService: EmployeeService,
    private toastService: ToastService
  ) {}

  onSubmit(): void {
    if (!this.employeeForm.isValid() || !this.employee) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const request: EmployeeRequest = this.employeeForm.getValue();

    this.employeeService.update(this.employee.id, request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.toastService.success('Employee updated successfully');
        this.employeeUpdated.emit();
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(err.message || 'Failed to update employee', 'Update Employee');
      },
    });
  }

  onCancel(): void {}
}
