import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-detail-field',
  standalone: true,
  template: `
    <div>
      <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">{{ label }}</p>
      <p class="text-sm font-medium text-gray-900">{{ value || '-' }}</p>
    </div>
  `
})
export class DetailFieldComponent {
  @Input() label!: string;
  @Input() value: string | number | null | undefined;
}
