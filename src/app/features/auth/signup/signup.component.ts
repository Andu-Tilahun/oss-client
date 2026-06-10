import {Component, ElementRef, QueryList, ViewChildren} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {switchMap} from 'rxjs/operators';
import {ToastService} from '../../../shared/toast/toast.service';
import {AuthService} from '../services/auth.service';
import {FileUploadService} from '../../../shared/file-upload/file-upload.service';
import {uploadDefaultAvatar} from '../../../shared/file-upload/default-avatar.util';

const OTP_LENGTH = 6;

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent {
  @ViewChildren('otpInput') otpInputRefs!: QueryList<ElementRef<HTMLInputElement>>;

  signupForm: FormGroup;
  submitted = false;
  isLoading = false;
  step: 1 | 2 = 1;
  signupEmail = '';
  otpDigits: string[] = Array(OTP_LENGTH).fill('');

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastService: ToastService,
    private authService: AuthService,
    private fileUploadService: FileUploadService,
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

  get isOtpComplete(): boolean {
    return this.otpDigits.every((d) => d.length === 1);
  }

  trackByIndex(index: number): number {
    return index;
  }

  private setOtpDigits(digits: string[]): void {
    this.otpDigits = digits.map((d) => d.replace(/\D/g, '').slice(-1));
  }

  private syncInputsToDom(): void {
    this.otpInputRefs?.forEach((ref, i) => {
      ref.nativeElement.value = this.otpDigits[i] ?? '';
    });
  }

  private focusOtpInput(index: number): void {
    const inputs = this.otpInputRefs?.toArray() ?? [];
    const clamped = Math.max(0, Math.min(index, inputs.length - 1));
    inputs[clamped]?.nativeElement.focus();
  }

  private applyDigitsFromIndex(digits: string[], startIndex: number): void {
    const next = [...this.otpDigits];
    digits.forEach((d, offset) => {
      const target = startIndex + offset;
      if (target < OTP_LENGTH) {
        next[target] = d;
      }
    });
    this.setOtpDigits(next);
    this.syncInputsToDom();

    const nextEmpty = next.findIndex((d) => !d);
    this.focusOtpInput(nextEmpty === -1 ? OTP_LENGTH - 1 : nextEmpty);
  }

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '');

    if (!digits) {
      const next = [...this.otpDigits];
      next[index] = '';
      this.setOtpDigits(next);
      input.value = '';
      return;
    }

    if (digits.length > 1) {
      this.applyDigitsFromIndex(digits.split(''), index);
      return;
    }

    const next = [...this.otpDigits];
    next[index] = digits;
    this.setOtpDigits(next);
    input.value = digits;

    if (index < OTP_LENGTH - 1) {
      this.focusOtpInput(index + 1);
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key !== 'Backspace') {
      return;
    }

    if (this.otpDigits[index]) {
      return;
    }

    if (index > 0) {
      event.preventDefault();
      const next = [...this.otpDigits];
      next[index - 1] = '';
      this.setOtpDigits(next);
      this.syncInputsToDom();
      this.focusOtpInput(index - 1);
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    const digits = (event.clipboardData?.getData('text') ?? '')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH)
      .split('');

    if (digits.length === 0) {
      return;
    }

    event.preventDefault();
    this.applyDigitsFromIndex(digits, 0);
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.signupForm.invalid) {
      this.toastService.error('Please fill in all required fields');
      return;
    }
    this.isLoading = true;
    const gender = this.f['gender'].value;

    uploadDefaultAvatar(this.fileUploadService, gender).pipe(
      switchMap((profileImageUuid) =>
        this.authService.signup({
          email: this.f['email'].value,
          firstName: this.f['firstName'].value,
          lastName: this.f['lastName'].value,
          middleName: this.f['middleName'].value || undefined,
          gender,
          profileImageUuid,
        }),
      ),
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.signupEmail = this.f['email'].value;
        this.setOtpDigits(Array(OTP_LENGTH).fill(''));
        this.step = 2;
        setTimeout(() => {
          this.syncInputsToDom();
          this.focusOtpInput(0);
        }, 50);
      },
      error: (err) => {
        this.isLoading = false;
        const message =
          err?.error?.message ||
          err?.message ||
          (err?.status === 401 || err?.status === 403
            ? 'Failed to set profile image. Please try again.'
            : 'Signup failed. Please try again.');
        this.toastService.error(message);
      },
    });
  }

  onVerify(): void {
    if (!this.isOtpComplete) {
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
