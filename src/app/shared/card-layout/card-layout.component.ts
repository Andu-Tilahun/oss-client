import { Component, ContentChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardFooterDirective } from './card-footer.directive';

export type CardHeaderVariant = 'default' | 'accent';

@Component({
  selector: 'app-card-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-layout.component.html',
  styleUrls: ['./card-layout.component.css']
})
export class CardLayoutComponent {
  /** Card title shown in the header */
  @Input() title = '';

  /** Optional Material icon name (e.g. 'assignment_ind') shown next to title */
  @Input() headerIcon = '';

  /** Header style: default (neutral) or accent (e.g. blue gradient for Assign Officer) */
  @Input() headerVariant: CardHeaderVariant = 'default';

  @ContentChild(CardFooterDirective) footerRef?: CardFooterDirective;

  get hasFooter(): boolean {
    return !!this.footerRef;
  }
}
