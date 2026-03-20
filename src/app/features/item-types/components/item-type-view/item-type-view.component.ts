import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemType } from '../../models/item-type.model';
import { ItemTypeService } from '../../services/item-type.service';
import { DetailCardComponent } from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import { DetailSectionComponent } from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import { DetailFieldComponent } from '../../../../shared/components/detail-field/detail-field/detail-field.component';

@Component({
  selector: 'app-item-type-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent],
  templateUrl: './item-type-view.component.html',
})
export class ItemTypeViewComponent implements OnInit {
  @Input() id?: string;

  itemType: ItemType | null = null;
  loading = false;
  error: string | null = null;

  constructor(private itemTypeService: ItemTypeService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.id) return;
    this.loading = true;
    this.error = null;
    this.itemTypeService.get(this.id).subscribe({
      next: (it: ItemType) => {
        this.itemType = it ?? null;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load item type';
        this.itemType = null;
        this.loading = false;
      },
    });
  }
}

