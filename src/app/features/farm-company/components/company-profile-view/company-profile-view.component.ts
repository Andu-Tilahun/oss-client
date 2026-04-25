import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CompanyProfile} from '../../models/company-profile.model';
import {DetailCardComponent} from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import {DetailSectionComponent} from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import {DetailFieldComponent} from '../../../../shared/components/detail-field/detail-field/detail-field.component';
import {OssMapComponent} from '../../../../shared/oss-map/oss-map.component';

@Component({
  selector: 'app-company-profile-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent, OssMapComponent],
  templateUrl: './company-profile-view.component.html',
})
export class CompanyProfileViewComponent {
  @Input() companyProfile: CompanyProfile | null = null;
  @Input() loading = false;
}
