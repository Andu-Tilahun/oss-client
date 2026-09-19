import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizationConfig } from '../../models/organization-config.model';
import { DetailCardComponent } from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import { DetailSectionComponent } from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import { DetailFieldComponent } from '../../../../shared/components/detail-field/detail-field/detail-field.component';
import { ProfilePictureUploadComponent } from '../../../../shared/file-upload/profile-picture-upload/profile-picture-upload.component';

@Component({
  selector: 'app-organization-config-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent, ProfilePictureUploadComponent],
  templateUrl: './organization-config-view.component.html',
})
export class OrganizationConfigViewComponent {
  @Input() config: OrganizationConfig | null = null;
}
