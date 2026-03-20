import { Component, Input, Output, EventEmitter, TemplateRef, ContentChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent implements OnInit, OnDestroy {
  // Visibility
  @Input() visible = false;
  @Input() closable = true;
  @Input() maskClosable = true;
  @Input() keyboard = true; // Close on ESC key

  // Content
  @Input() title = '';
  @Input() showHeader = true;
  @Input() showFooter = true;

  // Styling
  @Input() size: ModalSize = 'md';
  @Input() centered = true;

  // Footer buttons
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() confirmLoading = false;
  @Input() confirmDisabled = false;
  @Input() showConfirmButton = true;
  @Input() showCancelButton = true;

  // Button styles - blue for Save/Confirm, red for Cancel (consistent with app theme)
  @Input() confirmButtonClass = 'bg-blue-500 hover:bg-blue-600 text-white';
  @Input() cancelButtonClass = 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-200';

  // Content projection
  @ContentChild('modalHeader') modalHeader: TemplateRef<any> | null = null;
  @ContentChild('modalBody') modalBody: TemplateRef<any> | null = null;
  @ContentChild('modalFooter') modalFooter: TemplateRef<any> | null = null;

  // Events
  @Output() visibleChange = new EventEmitter();
  @Output() confirm = new EventEmitter();
  @Output() cancel = new EventEmitter();
  @Output() afterClose = new EventEmitter();

  ngOnInit() {
    if (this.keyboard) {
      document.addEventListener('keydown', this.handleKeyDown);
    }
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.visible && this.closable) {
      this.close();
    }
  };

  get modalSizeClass(): string {
    const sizes = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      xxl: 'max-w-7xl',
      full: 'max-w-full mx-4'
    };
    return sizes[this.size];
  }

  get modalPositionClass(): string {
    return this.centered
      ? 'items-center justify-center'
      : 'items-start justify-center pt-20';
  }

  handleMaskClick() {
    if (this.maskClosable && this.closable) {
      this.close();
    }
  }

  close() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cancel.emit();
    this.afterClose.emit();
  }

  handleConfirm() {
    this.confirm.emit();
  }

  handleCancel() {
    this.close();
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }
}
