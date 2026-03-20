import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ItemViewComponent } from '../../components/item-view/item-view.component';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [PageHeaderComponent, ItemViewComponent],
  templateUrl: './item-detail.component.html',
})
export class ItemDetailComponent implements OnInit {
  id: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
  }

  goBack(): void {
    this.router.navigate(['/inventory/items']);
  }
}

