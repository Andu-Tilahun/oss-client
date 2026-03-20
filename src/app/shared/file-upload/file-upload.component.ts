import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FileMetadata, FileUploadService} from "./file-upload.service";

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {
  @Input() accept: string = '*/*'; // Accept all file types by default
  @Input() maxSizeMB: number = 10;
  @Input() currentFileId?: number;
  @Input() showPreview: boolean = true;
  @Input() previewType: 'image' | 'document' = 'document'; // image for profile pics, document for files
  @Input() label: string = 'Choose File';
  @Input() multiple: boolean = false;

  @Output() fileUploaded = new EventEmitter<number>(); // Emits storage service file ID
  @Output() uploadError = new EventEmitter<string>();
  @Output() uploadComplete = new EventEmitter<FileMetadata>();

  uploadProgress: number = 0;
  isUploading: boolean = false;
  selectedFile?: File;
  currentFileMetadata?: FileMetadata;
  errorMessage?: string;

  constructor(private fileUploadService: FileUploadService) {}

  ngOnInit() {
    if (this.currentFileId) {
      this.loadCurrentFile(this.currentFileId);
    }
  }

  loadCurrentFile(fileId: number) {
    this.fileUploadService.getFileMetadata(fileId).subscribe({
      next: (metadata) => {
        this.currentFileMetadata = metadata;
      },
      error: (error) => {
        console.error('Failed to load file metadata:', error);
      }
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];

    if (!file) {
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > this.maxSizeMB) {
      this.errorMessage = `File size exceeds ${this.maxSizeMB}MB limit`;
      this.uploadError.emit(this.errorMessage);
      return;
    }

    this.selectedFile = file;
    this.errorMessage = undefined;

    // Auto-upload
    this.uploadFile();
  }

  uploadFile() {
    if (!this.selectedFile) {
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    this.errorMessage = undefined;

    this.fileUploadService.uploadFile(this.selectedFile).subscribe({
      next: (progress) => {
        this.uploadProgress = progress.progress;

        if (progress.file) {
          // Upload complete
          this.isUploading = false;
          this.currentFileMetadata = progress.file;
          this.fileUploaded.emit(progress.file.id);
          this.uploadComplete.emit(progress.file);
        }
      },
      error: (error) => {
        this.isUploading = false;
        this.uploadProgress = 0;
        this.errorMessage = error.message || 'Upload failed';
        this.uploadError.emit(this.errorMessage);
      }
    });
  }

  removeFile() {
    this.selectedFile = undefined;
    this.currentFileMetadata = undefined;
    this.uploadProgress = 0;
    this.errorMessage = undefined;
    this.fileUploaded.emit(undefined);
  }

  downloadFile() {
    if (this.currentFileMetadata?.presignedUrl) {
      window.open(this.currentFileMetadata.presignedUrl, '_blank');
    }
  }

  triggerFileInput(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  isImage(contentType?: string): boolean {
    return contentType?.startsWith('image/') || false;
  }

  isPdf(contentType?: string): boolean {
    return contentType === 'application/pdf';
  }

  getFileIcon(contentType?: string): string {
    if (this.isImage(contentType)) return 'image';
    if (this.isPdf(contentType)) return 'pdf';
    if (contentType?.includes('word')) return 'word';
    if (contentType?.includes('excel') || contentType?.includes('spreadsheet')) return 'excel';
    return 'file';
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
