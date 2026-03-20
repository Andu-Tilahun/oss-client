import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { RegionViewComponent } from '../../components/region-view/region-view.component';

@Component({
  selector: 'app-region-detail',
  standalone: true,
  imports: [PageHeaderComponent, RegionViewComponent],
  templateUrl: './region-detail.component.html',
})
export class RegionDetailComponent implements OnInit {
  id: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
  }

  goBack(): void {
    this.router.navigate(['/regions']);
  }
}
