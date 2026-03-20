import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FileMetadata, FileUploadService} from "../file-upload.service";

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-upload.component.html',
  styleUrls: ['./document-upload.component.css']
})
export class DocumentUploadComponent implements OnInit {
  @Input() label: string = 'Document';
  @Input() currentFileId?: string;
  @Input() accept: string = 'image/*,.pdf'; // Images and PDFs
  @Input() required: boolean = false;
  /** When true, hide upload/remove controls and allow view only */
  @Input() viewOnly: boolean = false;

  @Output() fileUploaded = new EventEmitter<string>(); // Emits file ID
  @Output() fileRemoved = new EventEmitter<void>();
  @Output() uploadError = new EventEmitter<string>();

  uploadProgress: number = 0;
  isUploading: boolean = false;
  currentFile?: FileMetadata;
  errorMessage?: string;

  constructor(private fileUploadService: FileUploadService) {}

  ngOnInit() {
    if (this.currentFileId) {
      this.loadCurrentFile();
    }
  }

  ngOnChanges() {
    if (this.currentFileId) {
      this.loadCurrentFile();
    }
  }

  loadCurrentFile() {
    if (!this.currentFileId) return;

    this.fileUploadService.getFileMetadata(this.currentFileId).subscribe({
      next: (metadata) => {
        this.currentFile = metadata;
      },
      error: (error) => {
        console.error('Failed to load file metadata:', error);
      }
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];

    if (!file) return;

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.errorMessage = 'File size must be less than 10MB';
      this.uploadError.emit(this.errorMessage);
      return;
    }

    this.errorMessage = undefined;
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
          this.currentFile = progress.file;
          this.fileUploaded.emit(progress.file.id);
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

  viewDocument() {
    if (this.currentFile?.presignedUrl) {
      window.open(this.currentFile.presignedUrl, '_blank');
    }
  }

  removeDocument() {
    this.currentFile = undefined;
    this.currentFileId = undefined;
    this.fileRemoved.emit();
  }

  triggerFileInput(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  getFileIcon(): string {
    if (!this.currentFile) return 'document';

    if (this.currentFile.contentType === 'application/pdf') {
      return 'pdf';
    } else if (this.currentFile.contentType.startsWith('image/')) {
      return 'image';
    }
    return 'document';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
