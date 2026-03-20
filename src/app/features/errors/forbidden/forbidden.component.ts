import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div class="mb-6">
          <svg class="w-24 h-24 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>

        <h1 class="text-6xl font-bold text-gray-800 mb-4">403</h1>
        <h2 class="text-2xl font-semibold text-gray-700 mb-4">Access Forbidden</h2>
        <p class="text-gray-600 mb-8">
          You don't have permission to access this resource.
          <br>
          <span class="text-sm">Your role: <strong>{{ userRole }}</strong></span>
        </p>

        <div class="space-y-3">
          <button
            (click)="goHome()"
            class="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Home
          </button>
          <button
            (click)="goBack()"
            class="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  `
})
export class ForbiddenComponent {
  userRole = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    const user = this.authService.getCurrentUser();
    this.userRole = user?.role || 'Unknown';
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  goBack() {
    window.history.back();
  }
}
