import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleryItem } from '../../models/gallery-item.model';
import { DetailCardComponent } from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import { DetailSectionComponent } from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import { DetailFieldComponent } from '../../../../shared/components/detail-field/detail-field/detail-field.component';
import { environment } from '../../../../../environments/environment';
import { Endpoints } from '../../../../core/endpoint/endpoint.model';

@Component({
  selector: 'app-gallery-item-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent],
  templateUrl: './gallery-item-view.component.html',
})
export class GalleryItemViewComponent {
  @Input() item: GalleryItem | null = null;

  get mediaUrl(): string {
    return this.item ? `${environment.apiUrl}${Endpoints.STORAGE_ENDPOINT}/${this.item.mediaUuid}` : '';
  }
}
