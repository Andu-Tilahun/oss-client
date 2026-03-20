import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../shared/modals/modal/modal.component';
import { ItemTypeFormComponent } from '../../components/item-type-form/item-type-form.component';
import { ItemType, ItemTypeRequest } from '../../models/item-type.model';
import { ItemTypeService } from '../../services/item-type.service';
import { ToastService } from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-item-type-edit-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ItemTypeFormComponent],
  templateUrl: './item-type-edit-modal.component.html',
})
export class ItemTypeEditModalComponent {
  @Input() visible = false;
  @Input() itemType: ItemType | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() itemTypeUpdated = new EventEmitter<void>();

  @ViewChild(ItemTypeFormComponent) form!: ItemTypeFormComponent;

  isLoading = false;

  constructor(
    private itemTypeService: ItemTypeService,
    private toastService: ToastService
  ) {}

  onSubmit(): void {
    if (!this.form.isValid() || !this.itemType) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.itemTypeService.update(this.itemType.id, this.form.getValue()).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.toastService.success('Item type updated successfully');
        this.itemTypeUpdated.emit();
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(err.message || 'Failed to update item type', 'Update Item Type');
      },
    });
  }

  onCancel(): void {}
}
