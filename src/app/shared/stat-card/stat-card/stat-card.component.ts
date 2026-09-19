import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {StatCardVariant} from '../models/stat-card.model';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './stat-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCardComponent {
  /** Label shown above the value */
  @Input() label = '';

  /** Main numeric or string value */
  @Input() value: string | number = 0;

  /** Optional text appended after the value */
  @Input() suffix = '';

  /** Optional SVG path `d` attribute for a decorative icon */
  @Input() iconPath = '';

  /** Color variant — drives border, text, and background tones */
  @Input() variant: StatCardVariant = 'default';

  /** Navigates here on click/Enter when set — makes the card clickable and shows the corner arrow. */
  @Input() routerLink?: string | any[];

  /** Set true for a clickable card that doesn't navigate via routerLink (listen to (cardClick) instead). */
  @Input() clickable = false;

  @Output() cardClick = new EventEmitter<void>();

  get isClickable(): boolean {
    return this.clickable || !!this.routerLink;
  }

  /** True when `value` is a real number (formatted via the `number` pipe); false for a
   *  pre-formatted string (e.g. "2 / 3"), which is rendered as-is. */
  get isNumericValue(): boolean {
    return typeof this.value === 'number';
  }

  onActivate(): void {
    if (this.isClickable) {
      this.cardClick.emit();
    }
  }

  /** Map variant name → Tailwind classes for each visual zone */
  readonly variantStyles: Record<StatCardVariant, {
    wrapper: string;
    label: string;
    value: string;
    icon: string;
  }> = {
    default: {
      wrapper: 'bg-white border-gray-200',
      label: 'text-gray-500',
      value: 'text-gray-900',
      icon: 'text-gray-400',
    },
    blue: {
      wrapper: 'bg-white border-blue-200',
      label: 'text-blue-600',
      value: 'text-blue-700',
      icon: 'text-blue-400',
    },
    green: {
      wrapper: 'bg-white border-green-200',
      label: 'text-green-600',
      value: 'text-green-700',
      icon: 'text-green-400',
    },
    purple: {
      wrapper: 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200',
      label: 'text-purple-600',
      value: 'text-purple-700',
      icon: 'text-purple-400',
    },
    indigo: {
      wrapper: 'bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200',
      label: 'text-indigo-600',
      value: 'text-indigo-700',
      icon: 'text-indigo-400',
    },
    red: {
      wrapper: 'bg-white border-red-200',
      label: 'text-red-600',
      value: 'text-red-700',
      icon: 'text-red-400',
    },
    yellow: {
      wrapper: 'bg-white border-yellow-200',
      label: 'text-yellow-600',
      value: 'text-yellow-700',
      icon: 'text-yellow-400',
    },
    orange: {
      wrapper: 'bg-white border-orange-200',
      label: 'text-orange-600',
      value: 'text-orange-700',
      icon: 'text-orange-400',
    },
  };

  get styles() {
    return this.variantStyles[this.variant] ?? this.variantStyles['default'];
  }
}
