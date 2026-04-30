import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OssMapComponent } from '../../shared/oss-map/oss-map.component';
import { CompanyProfile } from '../../features/farm-company/models/company-profile.model';

@Component({
  selector: 'app-public-about-us',
  standalone: true,
  imports: [CommonModule, OssMapComponent],
  templateUrl: './public-about-us.component.html',
  styleUrl: './public-about-us.component.css',
})
export class PublicAboutUsComponent {
  @Input() company: CompanyProfile | null = null;
}
