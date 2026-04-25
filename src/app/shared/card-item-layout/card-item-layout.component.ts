import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-card-item-layout',
  templateUrl: './card-item-layout.component.html',
  styleUrls: ['./card-item-layout.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardItemLayoutComponent {
  @Input() headerLeft = '';
  @Input() headerRight = '';
}
