import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div class="mb-6">
          <svg class="w-24 h-24 mx-auto text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>

        <h1 class="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 class="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p class="text-gray-600 mb-8">
          Sorry, we couldn't find the page you're looking for.
          <br>
          <span class="text-sm">Please check the URL or navigate back.</span>
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
export class NotFoundComponent {
  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(['/home']);
  }

  goBack() {
    window.history.back();
  }
}
