import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {CommonModule} from '@angular/common';
import * as L from 'leaflet';
import {icon, Marker} from 'leaflet';

export interface MapLocation {
  lat: number;
  lng: number;
  name?: string;
  description?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-oss-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './oss-map.component.html',
  styleUrl: './oss-map.component.css',
})
export class OssMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  @Input() latitude = 9.1450;
  @Input() longitude = 40.4897;
  @Input() locations: MapLocation[] = [];
  @Input() interactive = false;
  @Input() height = '300px';
  @Input() zoom = 6;
  @Input() fitBounds = false;
  @Input() disableZoom = false;

  @Output() locationSelected = new EventEmitter<{ latitude: number; longitude: number }>();
  @Output() markerClicked = new EventEmitter<MapLocation>();

  private map!: L.Map;
  private markers: L.Marker[] = [];

  constructor() {
    const defaultIcon = icon({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    Marker.prototype.options.icon = defaultIcon;
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) {
      return;
    }

    if (changes['latitude'] || changes['longitude']) {
      this.updateMapCenter();
    }

    if (changes['locations']) {
      this.updateMarkers();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    if (!this.mapContainer?.nativeElement) {
      return;
    }

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [this.latitude, this.longitude],
      zoom: this.zoom,
      zoomControl: !this.disableZoom,
      scrollWheelZoom: !this.disableZoom,
      doubleClickZoom: !this.disableZoom,
      boxZoom: !this.disableZoom,
      keyboard: !this.disableZoom,
      touchZoom: !this.disableZoom
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    if (this.interactive) {
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.locationSelected.emit({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        });
      });
    }

    if (this.locations.length > 0) {
      this.updateMarkers();
    } else {
      this.updateMapCenter();
    }
  }

  private updateMapCenter(): void {
    if (!this.map) {
      return;
    }
    this.map.setView([this.latitude, this.longitude], this.zoom);
  }

  private updateMarkers(): void {
    if (!this.map) {
      return;
    }

    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];

    this.locations.forEach((location) => {
      if (location.lat === undefined || location.lng === undefined) {
        return;
      }

      const marker = L.marker([location.lat, location.lng])
        .addTo(this.map)
        .bindPopup(this.createPopupContent(location));

      marker.on('click', () => this.markerClicked.emit(location));
      this.markers.push(marker);
    });

    if (this.fitBounds && this.markers.length > 0) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  private createPopupContent(location: MapLocation): string {
    let content = '<div class="farm-popup">';
    if (location.name) {
      content += `<h4>${location.name}</h4>`;
    }
    if (location.description) {
      content += location.description.includes('<')
        ? location.description
        : `<p>${location.description}</p>`;
    }
    content += '</div>';
    return content || '<div class="farm-popup">Location</div>';
  }
}
