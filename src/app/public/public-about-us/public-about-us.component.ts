import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OssMapComponent } from '../../shared/oss-map/oss-map.component';
import { CompanyProfile } from '../../features/farm-company/models/company-profile.model';
import { SystemConfigService } from '../../features/system-config/services/system-config.service';
import { OrganizationConfig } from '../../features/system-config/models/organization-config.model';
import { BranchCenter } from '../../features/system-config/models/branch-center.model';
import { environment } from '../../../environments/environment';
import { Endpoints } from '../../core/endpoint/endpoint.model';

@Component({
  selector: 'app-public-about-us',
  standalone: true,
  imports: [CommonModule, OssMapComponent],
  templateUrl: './public-about-us.component.html',
  styleUrl: './public-about-us.component.css',
})
export class PublicAboutUsComponent implements OnInit {
  @Input() company: CompanyProfile | null = null;

  orgConfig: OrganizationConfig | null = null;
  branchCenters: BranchCenter[] = [];

  readonly defaultLat = 9.145;
  readonly defaultLng = 40.4897;

  constructor(private systemConfigService: SystemConfigService) {}

  ngOnInit(): void {
    this.systemConfigService.getOrganizationConfig().subscribe({
      next: (config) => (this.orgConfig = config),
      error: () => {},
    });

    this.systemConfigService.getBranchCenters().subscribe({
      next: (centers) => (this.branchCenters = centers),
      error: () => {},
    });
  }

  get latitude(): number {
    return this.orgConfig?.latitude ?? this.company?.latitude ?? this.defaultLat;
  }

  get longitude(): number {
    return this.orgConfig?.longitude ?? this.company?.longitude ?? this.defaultLng;
  }

  get headerImageUrl(): string {
    if (this.orgConfig?.logoUuid) {
      return `${environment.apiUrl}${Endpoints.STORAGE_ENDPOINT}/${this.orgConfig.logoUuid}`;
    }
    return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80';
  }

  get headquartersName(): string {
    return this.orgConfig?.name
      ? `${this.orgConfig.name} Headquarters`
      : this.company?.name
      ? `${this.company.name} Headquarters`
      : 'AgriVest Headquarters';
  }

  get headquartersTagline(): string {
    return this.orgConfig?.tagline ?? 'Modern Agricultural Investment Center';
  }

  get address(): string {
    return this.orgConfig?.address
      ?? (this.company?.name ? `${this.company.name}, Addis Ababa, Ethiopia` : 'AgriVest Center, Addis Ababa, Ethiopia');
  }

  get operatingHours(): string {
    return this.orgConfig?.operatingHours
      ?? 'Monday – Friday: 8:30 AM – 7:00 PM, Saturday: 8:30 AM – 5:00 PM';
  }

  get phone(): string {
    const fromConfig = this.orgConfig?.phone;
    if (fromConfig) return fromConfig;
    const mobile = this.company?.contactMobilePhone;
    const office = this.company?.officePhone;
    if (mobile && office) return `Phone: ${mobile}, Office: ${office}`;
    return mobile ? `Phone: ${mobile}` : office ? `Phone: ${office}` : 'Phone: +251 11 123 4567';
  }

  get email(): string {
    return this.orgConfig?.email ?? this.company?.email ?? 'info@agrivest.com';
  }

  get googleMapsUrl(): string {
    return `https://www.google.com/maps/search/?api=1&query=${this.latitude},${this.longitude}`;
  }

  get directionsUrl(): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${this.latitude},${this.longitude}`;
  }

  get mapLocations(): { lat: number; lng: number; name: string }[] {
    const hq = { lat: this.latitude, lng: this.longitude, name: this.headquartersName };
    const branches = this.branchCenters
      .filter(b => b.latitude != null && b.longitude != null)
      .map(b => ({ lat: b.latitude!, lng: b.longitude!, name: b.name }));
    return [hq, ...branches];
  }
}
