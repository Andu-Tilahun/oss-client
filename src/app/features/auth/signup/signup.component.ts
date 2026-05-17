import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {ToastService} from '../../../shared/toast/toast.service';
import {AuthService} from '../services/auth.service';

const FALLBACK_PROFILE_IMAGE_UUID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent {
  signupForm: FormGroup;
  submitted = false;
  isLoading = false;
  step: 1 | 2 = 1;
  signupEmail = '';
  otpDigits: string[] = ['', '', '', '', '', ''];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastService: ToastService,
    private authService: AuthService
  ) {
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      middleName: [''],
      email: ['', [Validators.required, Validators.email]],
      gender: ['', [Validators.required]],
    });
  }

  get f() {
    return this.signupForm.controls;
  }

  get otpValue(): string {
    return this.otpDigits.join('');
  }

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const digit = input.value.replace(/\D/g, '');
    this.otpDigits[index] = digit ? digit[digit.length - 1] : '';
    input.value = this.otpDigits[index];
    if (digit && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      this.otpDigits[index - 1] = '';
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    const digits = (event.clipboardData?.getData('text') ?? '')
      .replace(/\D/g, '')
      .slice(0, 6)
      .split('');
    digits.forEach((d, i) => (this.otpDigits[i] = d));
    document.getElementById(`otp-${Math.min(digits.length, 5)}`)?.focus();
    event.preventDefault();
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.signupForm.invalid) {
      this.toastService.error('Please fill in all required fields');
      return;
    }
    this.isLoading = true;
    const payload = {
      email: this.f['email'].value,
      firstName: this.f['firstName'].value,
      lastName: this.f['lastName'].value,
      middleName: this.f['middleName'].value || undefined,
      gender: this.f['gender'].value,
      profileImageUuid: FALLBACK_PROFILE_IMAGE_UUID,
    };
    this.authService.signup(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.signupEmail = this.f['email'].value;
        this.step = 2;
        setTimeout(() => document.getElementById('otp-0')?.focus(), 50);
      },
      error: (err) => {
        this.isLoading = false;
        const message = err?.error?.message || 'Signup failed. Please try again.';
        this.toastService.error(message);
      },
    });
  }

  onVerify(): void {
    if (this.otpValue.length < 6) {
      this.toastService.error('Please enter the complete 6-digit code');
      return;
    }
    this.isLoading = true;
    this.authService.verifyEmail({email: this.signupEmail, otp: this.otpValue}).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastService.success('Email verified! You can now log in.');
        this.router.navigateByUrl('/login');
      },
      error: (err) => {
        this.isLoading = false;
        const message = err?.error?.message || 'Invalid code. Please try again.';
        this.toastService.error(message);
      },
    });
  }

}