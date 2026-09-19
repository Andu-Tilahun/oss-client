import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {ModalComponent} from '../modal/modal.component';

@Component({
  selector: 'app-file-preview-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './file-preview-modal.component.html',
})
export class FilePreviewModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() url: string | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();

  safeUrl: SafeResourceUrl | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['url']) {
      this.safeUrl = this.url
        ? this.sanitizer.bypassSecurityTrustResourceUrl(this.url)
        : null;
    }
    if (changes['visible'] && !this.visible) {
      this.safeUrl = null;
    }
  }

  onClose(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
