import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  submitted = false;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  token = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'] || '';
    if (!this.token) {
      this.errorMessage = 'Invalid reset token';
    }
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  get f() {
    return this.resetForm.controls;
  }

  togglePassword(field: string) {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.resetForm.invalid || !this.token) {
      return;
    }

    this.isLoading = true;

    const request = {
      token: this.token,
      newPassword: this.resetForm.value.newPassword
    };

    this.authService.resetPassword(request).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Password reset successful! Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Failed to reset password';
      }
    });
  }
}
