import {Component, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {UserFormComponent} from '../../components/user-form/user-form.component';
import {AuthService} from '../../../auth/services/auth.service';
import {UserService} from '../../services/user.service';
import {ToastService} from '../../../../shared/toast/toast.service';
import {UpdateUserRequest, User} from '../../models/user.model';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, RouterModule, UserFormComponent],
  templateUrl: './profile-page.component.html',
})
export class ProfilePageComponent implements OnInit {
  @ViewChild('userForm') userForm!: UserFormComponent;

  currentUser: User | null = null;
  isSaving = false;

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
