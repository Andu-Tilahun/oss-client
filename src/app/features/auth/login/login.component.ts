import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {AuthService} from '../services/auth.service';
import {ToastService} from "../../../shared/toast/toast.service";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  submitted = false;
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  returnUrl;
  showServicesMenu = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Get return URL from route parameters or default to home
    this.returnUrl = '/home';
  }

  get f() {
    return this.loginForm.controls;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.toastService.error('Please fill in all required fields');
      return;
    }

    this.isLoading = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.toastService.success(`Welcome back, ${response.user.firstName}!`);
        this.router.navigateByUrl(this.returnUrl, {replaceUrl: true});
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(
          error.message || 'Invalid username or password',
          'Login Failed'
        );
      }
    });
  }
}
