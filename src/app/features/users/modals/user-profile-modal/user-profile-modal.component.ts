import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {UpdateUserRequest, User} from "../../models/user.model";
import {UserFormComponent} from "../../components/user-form/user-form.component";
import {UserService} from "../../services/user.service";
import {AuthService} from "../../../auth/services/auth.service";
import {ApiResponse} from "../../../../shared/models/api-response.model";
import {CommonModule} from "@angular/common";
import {ReactiveFormsModule} from "@angular/forms";
import {ModalComponent} from "../../../../shared/modals/modal/modal.component";
import {ToastService} from "../../../../shared/toast/toast.service";

@Component({
  selector: 'app-user-profile-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, UserFormComponent],
  templateUrl: './user-profile-modal.component.html',
  styleUrl: './user-profile-modal.component.css'
})
export class UserProfileModalComponent {
  @Input() visible = false;
  @Input() user: User | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() userUpdated = new EventEmitter<void>();

  @ViewChild('userForm') userForm!: UserFormComponent;

  isLoading = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private toastService: ToastService
  ) {
  }

  onSubmit() {
    if (!this.userForm.isValid() || !this.user) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.userForm.getValue();

    // Create update request (exclude username and password)
    const request: UpdateUserRequest = {
      email: formValue.email,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      middleName: formValue.middleName,
      gender: formValue.gender,
      profileUrl: formValue.profileUrl,
      profileImageUuid: formValue.profileImageUuid,
      branchId: formValue.branchId
    };

    this.userService.profileUser(request).subscribe({
      next: (updatedUser: User) => {
        this.isLoading = false;
        this.visible = false;
        this.toastService.success(`User updated successfully`);
        this.visibleChange.emit(false);

        const currentUser = this.authService.getCurrentUser();
        const isCurrentUser = currentUser != null;

        if (isCurrentUser && currentUser.id === updatedUser.id) {
          this.authService.updateCurrentUser(updatedUser);
        } else if (updatedUser && isCurrentUser) {
          // API may not return the updated user; fetch fresh user so header/form show latest data
          this.userService.getUserById(currentUser.id).subscribe({
            next: (res) => {
              if (res) this.authService.updateCurrentUser(res);
            }
          });
        }

        this.userUpdated.emit();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(
          error.message || 'Failed to update user',
          'Create User'
        );
      }
    });
  }

  onCancel() {
    // Form will auto-reset to user data via @Input
  }
}
