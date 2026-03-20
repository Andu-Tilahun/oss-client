import {Component} from '@angular/core';

@Component({
  selector: 'app-detail-card',
  standalone: true,
  template: `
    <div class="bg-white rounded-xl border border-gray-200 p-6">
      <ng-content></ng-content>
    </div>
  `
})
export class DetailCardComponent {
}
