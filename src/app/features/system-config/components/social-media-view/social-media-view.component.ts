import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocialMediaLink } from '../../models/social-media.model';
import { DetailCardComponent } from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import { DetailSectionComponent } from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import { DetailFieldComponent } from '../../../../shared/components/detail-field/detail-field/detail-field.component';

@Component({
  selector: 'app-social-media-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent],
  templateUrl: './social-media-view.component.html',
})
export class SocialMediaViewComponent {
  @Input() link: SocialMediaLink | null = null;
}
