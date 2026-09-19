import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ModalComponent} from '../modal/modal.component';
import {ProfilePictureUploadComponent} from '../../file-upload/profile-picture-upload/profile-picture-upload.component';
import {environment} from '../../../../environments/environment';

@Component({
  selector: 'app-profile-image-upload-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ProfilePictureUploadComponent],
  templateUrl: './profile-image-upload-modal.component.html',
})
export class ProfileImageUploadModalComponent {
  @Input() visible = false;
  @Input() currentFileId?: string;
  @Input() uploadUrl?: string;
  @Input() title = 'Change Profile Photo';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() fileUploaded = new EventEmitter<string>();
  @Output() uploadError = new EventEmitter<string>();

  @ViewChild('profilePictureUpload') profilePictureUpload?: ProfilePictureUploadComponent;

  get resolvedUploadUrl(): string {
    return this.uploadUrl ?? `${environment.apiUrl}/files`;
  }

  onFileUploaded(fileId: string): void {
    this.fileUploaded.emit(fileId);
    this.close();
  }

  onUploadError(message: string): void {
    this.uploadError.emit(message);
  }

  handleUpload(): void {
    this.profilePictureUpload?.uploadPendingFile();
  }

  handleCancel(): void {
    this.close();
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  get canUpload(): boolean {
    return !!this.profilePictureUpload?.hasPendingUpload() && !this.profilePictureUpload?.isUploading;
  }

  get isUploading(): boolean {
    return !!this.profilePictureUpload?.isUploading;
  }

  get pendingPreviewUrl(): string | undefined {
    return this.profilePictureUpload?.pendingPreviewUrl;
  }

  get hasPendingUpload(): boolean {
    return !!this.profilePictureUpload?.hasPendingUpload();
  }
}
