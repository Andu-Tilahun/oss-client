import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {UserService} from '../../services/user.service';
import {AuthService} from '../../../auth/services/auth.service';
import {UpdateUserRequest, User} from '../../models/user.model';
import {ReactiveFormsModule} from "@angular/forms";
import {ModalComponent} from "../../../../shared/modals/modal/modal.component";
import {UserFormComponent} from "../../components/user-form/user-form.component";
import {ApiResponse} from "../../../../shared/models/api-response.model";
import {ToastService} from "../../../../shared/toast/toast.service";

@Component({
  selector: 'app-user-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, UserFormComponent],
  templateUrl: './user-edit-modal.component.html'
})
export class UserEditModalComponent {
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
      profileImageUuid: formValue.profileImageUuid,
      branchId: formValue.branchId
    };

    this.userService.updateUser(this.user.id, request).subscribe({
      next: (updatedUser: ApiResponse<User>) => {
        this.isLoading = false;
        this.visible = false;
        this.toastService.success(`User updated successfully`);
        this.visibleChange.emit(false);
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
