import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../shared/modals/modal/modal.component';
import { ItemFormComponent } from '../../components/item-form/item-form.component';
import { Item } from '../../models/item.model';
import { ItemType } from '../../../item-types/models/item-type.model';
import { ItemService } from '../../services/item.service';
import { ItemTypeService } from '../../../item-types/services/item-type.service';
import { ToastService } from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-item-edit-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ItemFormComponent],
  templateUrl: './item-edit-modal.component.html',
})
export class ItemEditModalComponent {
  @Input() visible = false;
  @Input() item: Item | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() itemUpdated = new EventEmitter<void>();

  @ViewChild(ItemFormComponent) form!: ItemFormComponent;

  @Input() itemTypes: ItemType[] = [];
  isLoading = false;

  constructor(
    private itemService: ItemService,
    private itemTypeService: ItemTypeService,
    private toastService: ToastService
  ) {}

  onSubmit(): void {
    if (!this.form.isValid() || !this.item) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.itemService.update(this.item.id, this.form.getValue()).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.toastService.success('Item updated successfully');
        this.itemUpdated.emit();
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(err.message || 'Failed to update item', 'Update Item');
      },
    });
  }

  onCancel(): void {}
}
