import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/services/auth.service';
import { RegisterRequest } from '../../models/user.model';
import {ReactiveFormsModule} from "@angular/forms";
import {ModalComponent} from "../../../../shared/modals/modal/modal.component";
import {UserFormComponent} from "../../components/user-form/user-form.component";
import {ToastService} from "../../../../shared/toast/toast.service";

@Component({
  selector: 'app-user-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, ModalComponent, UserFormComponent],
  templateUrl: './user-create-modal.component.html'
})
export class UserCreateModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() userCreated = new EventEmitter<void>();

  @ViewChild('userForm') userForm!: UserFormComponent;

  isLoading = false;

  constructor(private authService: AuthService, private toastService: ToastService) {}

  onSubmit() {
    if (!this.userForm.isValid()) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const request: RegisterRequest = this.userForm.getValue();

    this.authService.register(request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.toastService.success(`User registered successfully`);
        this.visibleChange.emit(false);
        this.userForm.reset();
        this.userCreated.emit();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(
          error.message || 'Failed to create user',
          'Create User'
        );
      }
    });
  }

  onCancel() {
    this.userForm.reset();
  }
}
