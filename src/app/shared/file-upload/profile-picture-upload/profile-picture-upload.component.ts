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

  @Output() fileUploaded = new EventEmitter<string>(); // Emits file ID
  @Output() fileRemoved = new EventEmitter<void>();
  @Output() uploadError = new EventEmitter<string>();

  uploadProgress = 0;
  isUploading = false;
  previewUrl?: string;
  defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff&size=200';
  errorMessage?: string;

  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  constructor(private fileUploadService: FileUploadService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.currentFileId) {
      this.loadCurrentImage();
    } else {
      this.previewUrl = this.defaultAvatar;
    }
  }

  loadCurrentImage() {
    if (!this.currentFileId) return;

    this.fileUploadService.getFileMetadata(this.currentFileId).subscribe({
      next: (metadata) => {
        this.previewUrl = metadata.presignedUrl;
      },
      error: () => {
        this.previewUrl = this.defaultAvatar;
      }
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select an image file';
      this.uploadError.emit(this.errorMessage);
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.errorMessage = 'File size must be less than 5MB';
      this.uploadError.emit(this.errorMessage);
      return;
    }

    this.errorMessage = undefined;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewUrl = e.target.result;
    };
    reader.readAsDataURL(file);

    // Upload file
    this.uploadFile(file);
  }

  uploadFile(file: File) {
    this.isUploading = true;
    this.uploadProgress = 0;

    this.fileUploadService.uploadFile(file).subscribe({
      next: (progress) => {
        this.uploadProgress = progress.progress;

        if (progress.file) {
          this.isUploading = false;
          this.previewUrl = progress.file.presignedUrl;
          this.fileUploaded.emit(progress.file.id);
        }
      },
      error: (error) => {
        this.isUploading = false;
        this.uploadProgress = 0;
        this.errorMessage = error.message || 'Upload failed';
        this.uploadError.emit(this.errorMessage);
        this.previewUrl = this.defaultAvatar;
      }
    });
  }

  removeImage() {
    this.previewUrl = this.defaultAvatar;
    this.currentFileId = undefined;
    this.fileRemoved.emit();
  }

  triggerFileInput() {
    this.fileInputRef?.nativeElement?.click();
  }

  getSizeClass(): string {
    const sizes = {
      small: 'w-24 h-24',
      medium: 'w-32 h-32',
      large: 'w-40 h-40'
    };
    return sizes[this.size];
  }
}
