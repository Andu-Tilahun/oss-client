import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../shared/modals/modal/modal.component';
import { ItemTypeFormComponent } from '../../components/item-type-form/item-type-form.component';
import { ItemTypeRequest } from '../../models/item-type.model';
import { ItemTypeService } from '../../services/item-type.service';
import { ToastService } from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-item-type-create-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ItemTypeFormComponent],
  templateUrl: './item-type-create-modal.component.html',
})
export class ItemTypeCreateModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() itemTypeCreated = new EventEmitter<void>();

  @ViewChild(ItemTypeFormComponent) form!: ItemTypeFormComponent;

  isLoading = false;

  constructor(
    private itemTypeService: ItemTypeService,
    private toastService: ToastService
  ) {}

  onSubmit(): void {
    if (!this.form.isValid()) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.itemTypeService.create(this.form.getValue()).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.form.reset();
        this.toastService.success('Item type created successfully');
        this.itemTypeCreated.emit();
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(err.message || 'Failed to create item type', 'Create Item Type');
      },
    });
  }

  onCancel(): void {
    this.form.reset();
  }
}
