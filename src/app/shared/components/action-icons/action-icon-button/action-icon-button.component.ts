import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';

export type ActionIconType = 'plus' | 'edit' | 'close' | 'save';

@Component({
  selector: 'app-action-icon-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './action-icon-button.component.html',
  styleUrls: ['./action-icon-button.component.css'],
})
export class ActionIconButtonComponent {
  @Input() icon: ActionIconType = 'plus';
  @Input() disabled = false;
  @Input() title = '';

  // Simple sizing control (keeps SVG + hit-area consistent).
  @Input() size: 'sm' | 'md' = 'md';

  /**
   * Extra classes applied to the button element.
   * Example: `text-blue-600 hover:text-blue-700`
   */
  @Input() buttonClass = '';

  /**
   * Extra classes applied to the SVG element.
   */
  @Input() svgClass = '';

  @Output() click = new EventEmitter<void>();

  get computedTitle(): string {
    return this.title || this.icon[0].toUpperCase() + this.icon.slice(1);
  }

  get buttonSizeClass(): string {
    return this.size === 'sm' ? 'w-7 h-7 p-0.5' : 'w-8 h-8 p-1';
  }

  get svgSizeClass(): string {
    return this.size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  }

  get iconPathD(): string {
    // Heroicons-like outline paths (stroke + no fill).
    switch (this.icon) {
      case 'plus':
        return 'M12 4v16m8-8H4';
      case 'edit':
        return 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z';
      case 'close':
        return 'M6 18L18 6M6 6l12 12';
      case 'save':
        // Simple "save" disk (floppy-like) icon.
        // Note: exact glyph may differ from your screenshot, but matches the project style.
        return 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8h10zM7 5h8v4H7V5z';
      default:
        return 'M12 4v16m8-8H4';
    }
  }
}

