import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-gallery-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-gallery-modal.component.html',
  styleUrl: './image-gallery-modal.component.css',
})
export class ImageGalleryModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() loading = false;
  @Input() title = 'Image Gallery';
  @Input() imageUrls: string[] = [];
  @Input() initialIndex = 0;

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

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.syncActiveIndex();
      return;
    }

    if (changes['initialIndex'] || changes['imageUrls']) {
      this.syncActiveIndex();
    }
  }

  private syncActiveIndex(): void {
    if (!this.hasImages) {
      this.activeIndex = 0;
      return;
    }

    this.activeIndex = this.clampIndex(this.initialIndex);
  }

  private clampIndex(index: number): number {
    if (!this.hasImages) {
      return 0;
    }
    return Math.min(Math.max(0, index), this.imageUrls.length - 1);
  }
}
