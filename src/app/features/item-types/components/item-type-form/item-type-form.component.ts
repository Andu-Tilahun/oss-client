import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ItemType, ItemTypeRequest } from '../../models/item-type.model';

@Component({
  selector: 'app-item-type-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './item-type-form.component.html',
})
export class ItemTypeFormComponent implements OnChanges {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() itemType: ItemType | null = null;

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      category: [''],
      gateTracked: [false],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['itemType'] && this.itemType && this.mode === 'edit') {
      this.form.patchValue({
        name: this.itemType.name,
        category: this.itemType.category || '',
        gateTracked: this.itemType.gateTracked ?? false,
      });
    }
  }

  isValid(): boolean {
    return this.form.valid;
  }

  getValue(): ItemTypeRequest {
    return this.form.getRawValue();
  }

  markAllAsTouched(): void {
    this.form.markAllAsTouched();
  }

  reset(): void {
    this.form.reset({ name: '', category: '', gateTracked: false });
  }
}
