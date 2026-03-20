import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="loadingService.loading$ | async"
         class="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center">
      <div class="bg-white rounded-lg p-8 shadow-2xl">
        <div class="flex flex-col items-center space-y-4">
          <svg class="animate-spin h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-gray-700 font-medium text-lg">Loading...</span>
        </div>
      </div>
    </div>
  `
})
export class LoadingSpinnerComponent {
  constructor(public loadingService: LoadingService) {}
}
