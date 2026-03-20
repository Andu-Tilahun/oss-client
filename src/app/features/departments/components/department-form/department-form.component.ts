import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Department, DepartmentRequest } from '../../models/department.model';

@Component({
  selector: 'app-department-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './department-form.component.html',
})
export class DepartmentFormComponent implements OnChanges {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() department: Department | null = null;

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['department'] && this.department && this.mode === 'edit') {
      this.form.patchValue({ name: this.department.name });
    }
  }

  isValid(): boolean {
    return this.form.valid;
  }

  getValue(): DepartmentRequest {
    return this.form.getRawValue();
  }

  markAllAsTouched(): void {
    this.form.markAllAsTouched();
  }

  reset(): void {
    this.form.reset();
  }
}
