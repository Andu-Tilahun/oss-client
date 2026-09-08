import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { filter, take } from 'rxjs/operators';
import { FileMetadata, FileUploadService } from '../../../../shared/file-upload/file-upload.service';
import { ToastService } from '../../../../shared/toast/toast.service';
import { GalleryMediaKind } from '../../models/gallery-item.model';

export interface GalleryMediaSelection {
  id: string;
  kind: GalleryMediaKind;
  previewUrl: string;
}

const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_FILE_SIZE = 50 * 1024 * 1024;

@Component({
  selector: 'app-gallery-media-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery-media-picker.component.html',
})
export class GalleryMediaPickerComponent implements OnChanges {
  @Input() currentMediaUuid?: string;
  @Input() currentKind?: GalleryMediaKind;
  @Output() mediaSelected = new EventEmitter<GalleryMediaSelection>();

  mode: 'upload' | 'existing' = 'upload';

  uploading = false;
  currentPreviewUrl: string | null = null;
  currentPreviewKind: GalleryMediaKind | null = null;

  loadingExisting = false;
  existingFiles: FileMetadata[] = [];

  constructor(
    private fileUploadService: FileUploadService,
    private toastService: ToastService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentMediaUuid'] && this.currentMediaUuid) {
      this.currentPreviewKind = this.currentKind ?? null;
      this.fileUploadService.getFileMetadata(this.currentMediaUuid).subscribe({
        next: (metadata) => { this.currentPreviewUrl = metadata.presignedUrl; },
        error: () => { this.currentPreviewUrl = null; },
      });
    }
  }

  switchToUpload(): void {
    this.mode = 'upload';
  }

  switchToExisting(): void {
    this.mode = 'existing';
    if (this.existingFiles.length === 0) {
      this.loadExisting();
    }
  }

  loadExisting(): void {
    this.loadingExisting = true;
    this.fileUploadService.listFiles().subscribe({
      next: (files) => {
        this.existingFiles = files.filter(
          (f) => f.contentType?.startsWith('image/') || f.contentType?.startsWith('video/'),
        );
        this.loadingExisting = false;
      },
      error: () => {
        this.loadingExisting = false;
        this.toastService.error('Failed to load uploaded files', 'Media');
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    const kind = this.kindForContentType(file.type);
    if (!kind) {
      this.toastService.error('Please select an image or video file', 'Gallery');
      return;
    }

    const maxSize = kind === 'VIDEO' ? MAX_VIDEO_FILE_SIZE : MAX_IMAGE_FILE_SIZE;
    if (file.size > maxSize) {
      this.toastService.error(`File size must be less than ${maxSize / (1024 * 1024)}MB`, 'Gallery');
      return;
    }

    this.uploading = true;
    this.fileUploadService.uploadFile(file).pipe(
      filter((progress) => !!progress.file),
      take(1),
    ).subscribe({
      next: (progress) => {
        this.uploading = false;
        const uploaded = progress.file!;
        const uploadedKind = this.kindForContentType(uploaded.contentType) ?? kind;
        this.select({ id: uploaded.id, kind: uploadedKind, previewUrl: uploaded.presignedUrl });
      },
      error: (err) => {
        this.uploading = false;
        this.toastService.error(err?.message || 'Failed to upload file', 'Gallery');
      },
    });
  }

  selectExisting(file: FileMetadata): void {
    const kind = this.kindForContentType(file.contentType);
    if (!kind) {
      return;
    }
    this.select({ id: file.id, kind, previewUrl: file.presignedUrl });
  }

  private select(selection: GalleryMediaSelection): void {
    this.currentPreviewUrl = selection.previewUrl;
    this.currentPreviewKind = selection.kind;
    this.mediaSelected.emit(selection);
  }

  private kindForContentType(contentType: string | undefined | null): GalleryMediaKind | null {
    if (!contentType) return null;
    if (contentType.startsWith('image/')) return 'IMAGE';
    if (contentType.startsWith('video/')) return 'VIDEO';
    return null;
  }
}
