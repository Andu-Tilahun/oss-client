import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ModalComponent} from "../modal/modal.component";

@Component({
  selector: 'app-image-preview-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './image-preview-modal.component.html',
  styleUrls: ['./image-preview-modal.component.css']
})
export class ImagePreviewModalComponent {
  @Input() visible = false;
  @Input() imageUrl = '';
  @Input() imageAlt = 'Image preview';
  @Input() title = 'Image Preview';
  @Input() caption = '';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();

  handleClose() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.close.emit();
  }
}
