import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Item,
  ItemRequest,
  ItemCondition,
  ItemStatus,
} from '../../models/item.model';
import { ItemType } from '../../../item-types/models/item-type.model';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './item-form.component.html',
})
export class ItemFormComponent implements OnInit, OnChanges {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() item: Item | null = null;
  @Input() itemTypes: ItemType[] = [];

  form: FormGroup;

  conditions: ItemCondition[] = ['New', 'Good', 'Fair', 'Damaged'];
  statuses: ItemStatus[] = ['New', 'Available', 'Borrowed', 'Replacement', 'Damaged', 'Retired'];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      itemTypeId: ['', Validators.required],
      serialNumber: ['', Validators.required],
      name: [''],
      condition: ['Good', Validators.required],
      status: ['New', Validators.required],
      note: [''],
      purchaseDate: [''],
    });
  }

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['item'] && this.item && this.mode === 'edit') {
      this.form.patchValue({
        itemTypeId: this.item.itemTypeId,
        serialNumber: this.item.serialNumber,
        name: this.item.name || '',
        condition: this.item.condition,
        status: this.item.status,
        note: this.item.note || '',
        purchaseDate: this.item.purchaseDate || '',
      });
    }
  }

  isValid(): boolean {
    return this.form.valid;
  }

  getValue(): ItemRequest {
    const v = this.form.getRawValue();
    return {
      itemTypeId: v.itemTypeId,
      serialNumber: v.serialNumber,
      name: v.name || undefined,
      condition: v.condition,
      status: v.status,
      note: v.note || undefined,
      purchaseDate: v.purchaseDate || undefined,
    };
  }

  markAllAsTouched(): void {
    this.form.markAllAsTouched();
  }

  reset(): void {
    this.form.reset({
      itemTypeId: '',
      serialNumber: '',
      name: '',
      condition: 'Good',
      status: 'New',
      note: '',
      purchaseDate: '',
    });
  }
}
