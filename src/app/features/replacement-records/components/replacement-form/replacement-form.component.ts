import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Item } from '../../../items/models/item.model';
import { ReplacementReason } from '../../models/replacement-record.model';

export interface ReplacementFormValue {
  newItemId: string;
  reason: ReplacementReason;
  oldItemFinalStatus: 'Retired' | 'Damaged';
  notes?: string | null;
}

@Component({
  selector: 'app-replacement-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './replacement-form.component.html',
})
export class ReplacementFormComponent {
  @Input() queue: Item[] = [];

  reasons: ReplacementReason[] = ['Broken', 'Lost', 'Damaged'];
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      newItemId: ['', Validators.required],
      reason: ['Damaged', Validators.required],
      oldItemFinalStatus: ['Retired', Validators.required],
      notes: [''],
    });
  }

  isValid(): boolean {
    return this.form.valid;
  }

  getValue(): ReplacementFormValue {
    const v = this.form.getRawValue();
    return {
      newItemId: v.newItemId,
      reason: v.reason,
      oldItemFinalStatus: v.oldItemFinalStatus,
      notes: (v.notes ?? '')?.trim() || null,
    };
  }

  markAllAsTouched(): void {
    this.form.markAllAsTouched();
  }

  reset(): void {
    this.form.reset({
      newItemId: '',
      reason: 'Damaged',
      oldItemFinalStatus: 'Retired',
      notes: '',
    });
  }
}

