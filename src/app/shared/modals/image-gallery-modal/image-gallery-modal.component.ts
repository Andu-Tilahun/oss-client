import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ModalComponent} from '../modal/modal.component';

@Component({
  selector: 'app-image-gallery-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './image-gallery-modal.component.html',
  styleUrl: './image-gallery-modal.component.css',
})
export class ImageGalleryModalComponent {
  @Input() visible = false;
  @Input() loading = false;
  @Input() title = 'Image Gallery';
  @Input() imageUrls: string[] = [];

  @Output() visibleChange = new EventEmitter<boolean>();

  activeIndex = 0;

  get hasImages(): boolean {
    return this.imageUrls.length > 0;
  }

  get activeImageUrl(): string {
    if (!this.hasImages) {
      return '';
    }
    return this.imageUrls[this.activeIndex];
  }

  goNext(): void {
    if (!this.hasImages) {
      return;
    }
    this.activeIndex = (this.activeIndex + 1) % this.imageUrls.length;
  }

  goPrevious(): void {
    if (!this.hasImages) {
      return;
    }
    this.activeIndex = (this.activeIndex - 1 + this.imageUrls.length) % this.imageUrls.length;
  }

  setActiveIndex(index: number): void {
    this.activeIndex = index;
  }
}
