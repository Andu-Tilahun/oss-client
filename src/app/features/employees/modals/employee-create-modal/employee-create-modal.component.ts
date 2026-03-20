import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/modals/modal/modal.component';
import { EmployeeFormComponent } from '../../components/employee-form/employee-form.component';
import { EmployeeService } from '../../services/employee.service';
import { ToastService } from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-employee-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, EmployeeFormComponent],
  templateUrl: './employee-create-modal.component.html',
})
export class EmployeeCreateModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() employeeCreated = new EventEmitter<void>();

  @ViewChild('employeeForm') employeeForm!: EmployeeFormComponent;

  isLoading = false;

  constructor(
    private employeeService: EmployeeService,
    private toastService: ToastService
  ) {}

  onSubmit(): void {
    if (!this.employeeForm.isValid()) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const request = this.employeeForm.getValue();

    this.employeeService.create(request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.employeeForm.reset();
        this.toastService.success('Employee created successfully');
        this.employeeCreated.emit();
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(err.message || 'Failed to create employee', 'Create Employee');
      },
    });
  }

  onCancel(): void {
    this.employeeForm.reset();
  }
}
