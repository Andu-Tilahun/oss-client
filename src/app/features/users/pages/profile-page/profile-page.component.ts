import {Component, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {UserFormComponent} from '../../components/user-form/user-form.component';
import {AuthService} from '../../../auth/services/auth.service';
import {UserService} from '../../services/user.service';
import {ToastService} from '../../../../shared/toast/toast.service';
import {UpdateUserRequest, User} from '../../models/user.model';
import {ProfileImageUploadModalComponent} from '../../../../shared/modals/profile-image-upload-modal/profile-image-upload-modal.component';
import {ProfilePictureUploadComponent} from '../../../../shared/file-upload/profile-picture-upload/profile-picture-upload.component';
import {environment} from '../../../../../environments/environment';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UserFormComponent,
    ProfileImageUploadModalComponent,
    ProfilePictureUploadComponent,
  ],
  templateUrl: './profile-page.component.html',
})
export class ProfilePageComponent implements OnInit {
  @ViewChild('userForm') userForm!: UserFormComponent;

  currentUser: User | null = null;
  isSaving = false;
  profileImageModalOpen = false;
  readonly profileImageUploadUrl = `${environment.apiUrl}/files`;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private toastService: ToastService
  ) {
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  openProfileImageModal(): void {
    this.profileImageModalOpen = true;
  }

  onProfileImageUploaded(fileId: string): void {
    this.userForm?.setProfileImageUuid(fileId);
    if (!this.currentUser) {
      return;
    }

    const request: UpdateUserRequest = {
      email: this.currentUser.email,
      firstName: this.currentUser.firstName,
      lastName: this.currentUser.lastName,
      middleName: this.currentUser.middleName,
      gender: this.currentUser.gender,
      profileImageUuid: fileId,
      branchId: this.currentUser.branchId,
    };

    this.userService.profileUser(request).subscribe({
      next: (updatedUser: User) => {
        this.currentUser = updatedUser;
        this.authService.updateCurrentUser(updatedUser);
        this.toastService.success('Profile photo updated');
      },
      error: (error) => {
        this.toastService.error(error.message || 'Failed to save profile photo', 'Profile Photo');
      },
    });
  }

  onProfileImageUploadError(message: string): void {
    this.toastService.error(message, 'Profile Photo');
  }

  saveProfile(): void {
    if (!this.currentUser || !this.userForm.isValid()) {
      this.userForm?.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const formValue = this.userForm.getValue();

    const request: UpdateUserRequest = {
      email: formValue.email,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      middleName: formValue.middleName,
      gender: formValue.gender,
      profileUrl: formValue.profileUrl,
      profileImageUuid: formValue.profileImageUuid,
      branchId: formValue.branchId,
    };

    this.userService.profileUser(request).subscribe({
      next: (updatedUser: User) => {
        this.isSaving = false;
        this.authService.updateCurrentUser(updatedUser);
        this.toastService.success('Profile updated successfully');
      },
      error: (error) => {
        this.isSaving = false;
        this.toastService.error(error.message || 'Failed to update profile', 'Update Profile');
      },
    });
  }
}
