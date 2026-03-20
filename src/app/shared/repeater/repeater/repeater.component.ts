import { Component, ContentChild, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-repeater',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './repeater.component.html',
  styleUrl: './repeater.component.css'
})
export class RepeaterComponent {
  @Input() formArray!: FormArray;
  @Input() title = 'Items';
  @Input() addButtonText = 'Add Item';
  @Input() emptyStateText = 'No items added yet';
  @Input() showIndex = false;
  @Input() minItems = 0;
  @Input() maxItems?: number;
  @Input() addButtonIcon = true;
  @Input() removeButtonIcon = true;
  @Input() showHeaderAddButton = true;
  @Input() showEmptyStateAddButton = true;

  @ContentChild('itemTemplate') itemTemplate!: TemplateRef<any>;
  @ContentChild('headerTemplate') headerTemplate?: TemplateRef<any>;

  @Output() add = new EventEmitter<void>();
  @Output() remove = new EventEmitter<number>();

  get items(): FormGroup[] {
    return this.formArray.controls as FormGroup[];
  }

  get canAdd(): boolean {
    if (this.maxItems) {
      return this.formArray.length < this.maxItems;
    }
    return true;
  }

  get canRemove(): boolean {
    return this.formArray.length > this.minItems;
  }

  onAdd() {
    if (this.canAdd) {
      this.add.emit();
    }
  }

  onRemove(index: number) {
    if (this.canRemove) {
      this.remove.emit(index);
    }
  }
}
