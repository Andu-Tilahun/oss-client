import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import {ToastService} from "../../../shared/toast/toast.service";

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  submitted = false;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService

  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get f() {
    return this.forgotForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.forgotForm.invalid) {
      return;
    }

    this.isLoading = true;

    this.authService.forgotPassword(this.forgotForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        // this.successMessage = 'Password reset link has been sent to your email';
        this.toastService.success(`Password reset link has been sent to your email`);
        this.forgotForm.reset();
        this.submitted = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(
          error.message,
          'Forgot Password'
        );
      }
    });
  }
}
