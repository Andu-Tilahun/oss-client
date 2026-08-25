import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-farm-restoration-coming-soon',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div class="mb-6">
          <svg class="w-24 h-24 mx-auto text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7m14 0L12 10 2 7"></path>
          </svg>
        </div>

        <h1 class="text-3xl font-bold text-gray-800 mb-4">Restoration & Follow-ups</h1>
        <h2 class="text-xl font-semibold text-indigo-600 mb-4">Coming Soon</h2>
        <p class="text-gray-600 mb-8">
          We're working on this feature.
          <br>
          <span class="text-sm">Please check back later.</span>
        </p>

        <button
          (click)="goHome()"
          class="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Go to Home
        </button>
      </div>
    </div>
  `
})
export class ComingSoonComponent {
  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(['/home']);
  }
}
