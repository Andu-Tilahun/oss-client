import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Item, ItemCondition } from '../../../items/models/item.model';

export interface BorrowFormValue {
  itemId: string;
  conditionAtBorrow: ItemCondition;
}

@Component({
  selector: 'app-borrow-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './borrow-form.component.html',
})
export class BorrowFormComponent {
  @Input() availableItems: Item[] = [];

  conditions: ItemCondition[] = ['New', 'Good', 'Fair', 'Damaged'];
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      itemId: ['', Validators.required],
      conditionAtBorrow: ['Good', Validators.required],
    });
  }

  isValid(): boolean {
    return this.form.valid;
  }

  getValue(): BorrowFormValue {
    const v = this.form.getRawValue();
    return {
      itemId: v.itemId,
      conditionAtBorrow: v.conditionAtBorrow,
    };
  }

  markAllAsTouched(): void {
    this.form.markAllAsTouched();
  }

  reset(): void {
    this.form.reset({
      itemId: '',
      conditionAtBorrow: 'Good',
    });
  }
}

