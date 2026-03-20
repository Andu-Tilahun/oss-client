import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GateScanRequest } from '../../models/gate-log.model';

@Component({
  selector: 'app-gate-scan-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gate-scan-form.component.html',
})
export class GateScanFormComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      employeeId: [''],
      itemId: [''],
      scannedBy: ['', Validators.required],
    });
  }

  isValid(): boolean {
    const v = this.form.getRawValue();
    const hasEmployee = !!(v.employeeId ?? '').trim();
    const hasItem = !!(v.itemId ?? '').trim();
    return this.form.valid && hasEmployee !== hasItem;
  }

  getValue(): GateScanRequest {
    const v = this.form.getRawValue();
    const employeeId = (v.employeeId ?? '').trim();
    const itemId = (v.itemId ?? '').trim();
    return {
      employeeId: employeeId || null,
      itemId: itemId || null,
      scannedBy: (v.scannedBy ?? '').trim(),
    };
  }

  markAllAsTouched(): void {
    this.form.markAllAsTouched();
  }

  resetIds(): void {
    this.form.patchValue({ employeeId: '', itemId: '' });
  }
}

