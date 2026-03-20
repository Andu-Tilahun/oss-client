import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Item } from '../../models/item.model';
import { ItemService } from '../../services/item.service';
import { DetailCardComponent } from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import { DetailSectionComponent } from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import { DetailFieldComponent } from '../../../../shared/components/detail-field/detail-field/detail-field.component';

@Component({
  selector: 'app-item-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent],
  templateUrl: './item-view.component.html',
})
export class ItemViewComponent implements OnInit {
  @Input() id?: string;

  item: Item | null = null;
  loading = false;
  error: string | null = null;

  constructor(private itemService: ItemService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.id) return;
    this.loading = true;
    this.error = null;
    this.itemService.get(this.id).subscribe({
      next: (i: Item) => {
        this.item = i ?? null;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load item';
        this.item = null;
        this.loading = false;
      },
    });
  }
}

