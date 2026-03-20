import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-detail-section',
  standalone: true,
  template: `
    <section>
      <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        {{ title }}
      </h4>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <ng-content></ng-content>
      </div>
    </section>
    <hr class="border-gray-200 my-8"/>
  `
})
export class DetailSectionComponent {
  @Input() title!: string;
}
