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

  readonly defaultLat = 9.145;
  readonly defaultLng = 40.4897;
  readonly headerImageUrl =
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80';

  get latitude(): number {
    return this.company?.latitude ?? this.defaultLat;
  }

  get longitude(): number {
    return this.company?.longitude ?? this.defaultLng;
  }

  get headquartersName(): string {
    return this.company?.name ? `${this.company.name} Headquarters` : 'AgriVest Headquarters';
  }

  get headquartersTagline(): string {
    return 'Modern Agricultural Investment Center';
  }

  get address(): string {
    return this.company?.name
      ? `${this.company.name}, Addis Ababa, Ethiopia`
      : 'AgriVest Center, Addis Ababa, Ethiopia';
  }

  get operatingHours(): string {
    return 'Monday – Friday: 8:30 AM – 7:00 PM, Saturday: 8:30 AM – 5:00 PM';
  }

  get phone(): string {
    const mobile = this.company?.contactMobilePhone;
    const office = this.company?.officePhone;
    if (mobile && office) {
      return `Phone: ${mobile}, Office: ${office}`;
    }
    return mobile ? `Phone: ${mobile}` : office ? `Phone: ${office}` : 'Phone: +251 11 123 4567';
  }

  get email(): string {
    return this.company?.email || 'info@agrivest.com';
  }

  get googleMapsUrl(): string {
    return `https://www.google.com/maps/search/?api=1&query=${this.latitude},${this.longitude}`;
  }

  get directionsUrl(): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${this.latitude},${this.longitude}`;
  }

  get mapLocations(): { lat: number; lng: number; name: string }[] {
    return [{ lat: this.latitude, lng: this.longitude, name: this.headquartersName }];
  }
}
