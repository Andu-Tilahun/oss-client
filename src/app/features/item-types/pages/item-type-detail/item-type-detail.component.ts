import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ItemTypeViewComponent } from '../../components/item-type-view/item-type-view.component';

@Component({
  selector: 'app-item-type-detail',
  standalone: true,
  imports: [PageHeaderComponent, ItemTypeViewComponent],
  templateUrl: './item-type-detail.component.html',
})
export class ItemTypeDetailComponent implements OnInit {
  id: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
  }

  goBack(): void {
    this.router.navigate(['/inventory/item-types']);
  }
}

