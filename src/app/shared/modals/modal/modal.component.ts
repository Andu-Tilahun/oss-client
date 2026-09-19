import {
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent implements OnInit, OnDestroy, OnChanges {
  private static openCount = 0;
  private hasLockedScroll = false;

  @Input() visible = false;
  @Input() closable = true;
  @Input() maskClosable = false;
  @Input() keyboard = true;

  @Input() title = '';
  @Input() showHeader = true;
  @Input() showFooter = true;

  @Input() size: ModalSize = 'md';
  @Input() centered = true;

  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() confirmLoading = false;
  @Input() confirmDisabled = false;
  @Input() showConfirmButton = true;
  @Input() showCancelButton = true;

  @Input() confirmButtonClass = 'bg-blue-500 hover:bg-blue-600 text-white';
  @Input() cancelButtonClass = 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-200';

  @ContentChild('modalHeader') modalHeader: TemplateRef<any> | null = null;
  @ContentChild('modalBody') modalBody: TemplateRef<any> | null = null;
  @ContentChild('modalFooter') modalFooter: TemplateRef<any> | null = null;

  @Output() visibleChange = new EventEmitter();
  @Output() confirm = new EventEmitter();
  @Output() cancel = new EventEmitter();
  @Output() afterClose = new EventEmitter();

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
  ) {}

  ngOnInit() {
    this.renderer.appendChild(document.body, this.elementRef.nativeElement);
    if (this.keyboard) {
      document.addEventListener('keydown', this.handleKeyDown);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      this.syncBodyScrollLock();
    }
  }

  ngOnDestroy() {
    if (this.hasLockedScroll) {
      this.unlockBodyScroll();
      this.hasLockedScroll = false;
    }
    document.removeEventListener('keydown', this.handleKeyDown);
    if (this.elementRef.nativeElement.parentNode === document.body) {
      this.renderer.removeChild(document.body, this.elementRef.nativeElement);
    }
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
    this.syncBodyScrollLock();
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

  private syncBodyScrollLock(): void {
    if (this.visible && !this.hasLockedScroll) {
      this.lockBodyScroll();
      this.hasLockedScroll = true;
    } else if (!this.visible && this.hasLockedScroll) {
      this.unlockBodyScroll();
      this.hasLockedScroll = false;
    }
  }

  private lockBodyScroll(): void {
    ModalComponent.openCount++;
    document.body.classList.add('modal-open');
  }

  private unlockBodyScroll(): void {
    ModalComponent.openCount = Math.max(0, ModalComponent.openCount - 1);
    if (ModalComponent.openCount === 0) {
      document.body.classList.remove('modal-open');
    }
  }
}
