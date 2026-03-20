import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Employee } from '../../../employees/models/employee.model';

export interface TransferFormValue {
  toEmployeeId: string;
  notes?: string | null;
}

@Component({
  selector: 'app-transfer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transfer-form.component.html',
})
export class TransferFormComponent {
  @Input() employees: Employee[] = [];

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      toEmployeeId: ['', Validators.required],
      notes: [''],
    });
  }

  isValid(): boolean {
    return this.form.valid;
  }

  getValue(): TransferFormValue {
    const v = this.form.getRawValue();
    return {
      toEmployeeId: v.toEmployeeId,
      notes: (v.notes ?? '')?.trim() || null,
    };
  }

  markAllAsTouched(): void {
    this.form.markAllAsTouched();
  }

  reset(): void {
    this.form.reset({
      toEmployeeId: '',
      notes: '',
    });
  }
}

