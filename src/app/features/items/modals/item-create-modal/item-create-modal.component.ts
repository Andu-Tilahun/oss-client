import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../shared/modals/modal/modal.component';
import { ItemFormComponent } from '../../components/item-form/item-form.component';
import { ItemType } from '../../../item-types/models/item-type.model';
import { ItemService } from '../../services/item.service';
import { ItemTypeService } from '../../../item-types/services/item-type.service';
import { ToastService } from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-item-create-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ItemFormComponent],
  templateUrl: './item-create-modal.component.html',
})
export class ItemCreateModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() itemCreated = new EventEmitter<void>();

  @ViewChild(ItemFormComponent) form!: ItemFormComponent;

  @Input() itemTypes: ItemType[] = [];
  isLoading = false;

  constructor(
    private itemService: ItemService,
    private itemTypeService: ItemTypeService,
    private toastService: ToastService
  ) {}

  onSubmit(): void {
    if (!this.form.isValid()) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.itemService.create(this.form.getValue()).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.form.reset();
        this.toastService.success('Item created successfully');
        this.itemCreated.emit();
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(err.message || 'Failed to create item', 'Create Item');
      },
    });
  }

  onCancel(): void {
    this.form.reset();
  }
}
