import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadService } from "../file-upload.service";

@Component({
  selector: 'app-profile-picture-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-picture-upload.component.html',
  styleUrls: ['./profile-picture-upload.component.css']
})
export class ProfilePictureUploadComponent implements OnChanges {
  @Input() currentFileId?: string;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  /** When true, only display the image (no upload/remove buttons). Use for viewing another user's photo. */
  @Input() viewOnly = false;
  /** When true, show preview on file select and upload only when user clicks Upload. */
  @Input() deferUpload = false;
  /** Optional override for the file upload POST endpoint. */
  @Input() uploadUrl?: string;
  /** When false, hide the inline Upload button (e.g. when parent modal provides Upload). */
  @Input() showInlineUploadButton = true;

  @Output() fileUploaded = new EventEmitter<string>();
  @Output() fileRemoved = new EventEmitter<void>();
  @Output() uploadError = new EventEmitter<string>();

  uploadProgress = 0;
  isUploading = false;
  previewUrl?: string;
  defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff&size=200';
  errorMessage?: string;
  pendingFile: File | null = null;
  private savedFileId?: string;
  private savedPreviewUrl?: string;

  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  constructor(private fileUploadService: FileUploadService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentFileId']) {
      this.pendingFile = null;
      if (this.currentFileId) {
        this.loadCurrentImage();
      } else {
        this.setSavedState(undefined, this.defaultAvatar);
        this.previewUrl = this.defaultAvatar;
      }
    }
  }

  loadCurrentImage() {
    if (!this.currentFileId) return;

    this.fileUploadService.getFileMetadata(this.currentFileId).subscribe({
      next: (metadata) => {
        this.setSavedState(this.currentFileId, metadata.presignedUrl);
        this.previewUrl = metadata.presignedUrl;
      },
      error: () => {
        this.setSavedState(undefined, this.defaultAvatar);
        this.previewUrl = this.defaultAvatar;
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select an image file';
      this.uploadError.emit(this.errorMessage);
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.errorMessage = 'File size must be less than 5MB';
      this.uploadError.emit(this.errorMessage);
      return;
    }

    this.errorMessage = undefined;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.previewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    if (this.deferUpload) {
      this.pendingFile = file;
      return;
    }

    this.uploadFile(file);
    input.value = '';
  }

  uploadPendingFile(): void {
    if (!this.pendingFile || this.isUploading) {
      return;
    }
    this.uploadFile(this.pendingFile);
  }

  uploadFile(file: File) {
    this.isUploading = true;
    this.uploadProgress = 0;

    this.fileUploadService.uploadFile(file, this.uploadUrl).subscribe({
      next: (progress) => {
        this.uploadProgress = progress.progress;

        if (progress.file) {
          this.isUploading = false;
          this.pendingFile = null;
          this.previewUrl = progress.file.presignedUrl;
          this.currentFileId = progress.file.id;
          this.setSavedState(progress.file.id, progress.file.presignedUrl);
          this.fileUploaded.emit(progress.file.id);
          if (this.fileInputRef?.nativeElement) {
            this.fileInputRef.nativeElement.value = '';
          }
        }
      },
      error: (error) => {
        this.isUploading = false;
        this.uploadProgress = 0;
        this.errorMessage = error.message || 'Upload failed';
        this.uploadError.emit(this.errorMessage);
        if (!this.deferUpload) {
          this.previewUrl = this.savedPreviewUrl ?? this.defaultAvatar;
        }
      }
    });
  }

  removeImage() {
    if (this.pendingFile) {
      this.pendingFile = null;
      this.previewUrl = this.savedPreviewUrl ?? this.defaultAvatar;
      if (this.fileInputRef?.nativeElement) {
        this.fileInputRef.nativeElement.value = '';
      }
      return;
    }

    this.previewUrl = this.defaultAvatar;
    this.currentFileId = undefined;
    this.setSavedState(undefined, this.defaultAvatar);
    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
    this.fileRemoved.emit();
  }

  triggerFileInput() {
    this.fileInputRef?.nativeElement?.click();
  }

  hasPendingUpload(): boolean {
    return !!this.pendingFile;
  }

  get pendingPreviewUrl(): string | undefined {
    return this.hasPendingUpload() ? this.previewUrl : undefined;
  }

  get choosePhotoLabel(): string {
    return this.deferUpload ? 'Choose Photo' : 'Upload Photo';
  }

  get showRemoveButton(): boolean {
    return !this.viewOnly
      && !this.isUploading
      && (this.hasPendingUpload() || (!!this.currentFileId && this.previewUrl !== this.defaultAvatar));
  }

  getSizeClass(): string {
    const sizes = {
      small: 'w-24 h-24',
      medium: 'w-32 h-32',
      large: 'w-40 h-40'
    };
    return sizes[this.size];
  }

  private setSavedState(fileId: string | undefined, previewUrl: string): void {
    this.savedFileId = fileId;
    this.savedPreviewUrl = previewUrl;
  }
}
