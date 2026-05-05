import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompanyProfile } from '../../features/farm-company/models/company-profile.model';

@Component({
  selector: 'app-public-contact',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-contact.component.html',
  styleUrl: './public-contact.component.css',
})
export class PublicContactComponent {
  @Input() company: CompanyProfile | null = null;
  @Input() loadingCompany = false;
}
