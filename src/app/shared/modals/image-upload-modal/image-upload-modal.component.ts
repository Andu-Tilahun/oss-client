import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {filter, take} from 'rxjs/operators';
import {ModalComponent} from '../modal/modal.component';
import {FileUploadService} from '../../file-upload/file-upload.service';
import {environment} from '../../../../environments/environment';

@Component({
  selector: 'app-image-upload-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './image-upload-modal.component.html',
})
export class ImageUploadModalComponent {
  @Input() visible = false;
  @Input() title = 'Upload Image';
  @Input() uploadUrl?: string;
  @Input() maxSizeMB = 10;
  @Input() accept = 'image/*';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() fileUploaded = new EventEmitter<string>();
  @Output() uploadError = new EventEmitter<string>();

  pendingFile: File | null = null;
  pendingPreviewUrl?: string;
  isUploading = false;
  errorMessage?: string;

  constructor(private fileUploadService: FileUploadService) {}

  get resolvedUploadUrl(): string {
    return this.uploadUrl ?? `${environment.apiUrl}/files`;
  }

  get canUpload(): boolean {
    return !!this.pendingFile && !this.isUploading;
  }

  triggerFileInput(input: HTMLInputElement): void {
    if (this.isUploading) {
      return;
    }
    input.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.setError('Please select an image file');
      return;
    }

    const maxBytes = this.maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      this.setError(`File size must be less than ${this.maxSizeMB}MB`);
      return;
    }

    this.clearError();
    this.revokePreviewUrl();
    this.pendingFile = file;
    this.pendingPreviewUrl = URL.createObjectURL(file);
  }

  handleUpload(): void {
    if (!this.pendingFile || this.isUploading) {
      return;
    }

    this.isUploading = true;
    this.clearError();

    this.fileUploadService.uploadFile(this.pendingFile, this.resolvedUploadUrl).pipe(
      filter((progress) => !!progress.file),
      take(1),
    ).subscribe({
      next: (progress) => {
        this.isUploading = false;
        const uploaded = progress.file!;
        this.fileUploaded.emit(uploaded.id);
        this.resetState();
        this.close();
      },
      error: (err) => {
        this.isUploading = false;
        const message = err?.message || 'Failed to upload image';
        this.setError(message);
        this.uploadError.emit(message);
      },
    });
  }

  handleCancel(): void {
    this.resetState();
    this.close();
  }

  onVisibleChange(visible: boolean): void {
    this.visible = visible;
    this.visibleChange.emit(visible);
    if (!visible) {
      this.resetState();
    }
  }

  private close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  private resetState(): void {
    this.revokePreviewUrl();
    this.pendingFile = null;
    this.pendingPreviewUrl = undefined;
    this.isUploading = false;
    this.clearError();
  }

  private revokePreviewUrl(): void {
    if (this.pendingPreviewUrl) {
      URL.revokeObjectURL(this.pendingPreviewUrl);
    }
  }

  private setError(message: string): void {
    this.errorMessage = message;
    this.uploadError.emit(message);
  }

  private clearError(): void {
    this.errorMessage = undefined;
  }
}
