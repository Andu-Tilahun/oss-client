import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SubcityViewComponent } from '../../components/subcity-view/subcity-view.component';

@Component({
  selector: 'app-subcity-detail',
  standalone: true,
  imports: [PageHeaderComponent, SubcityViewComponent],
  templateUrl: './subcity-detail.component.html',
})
export class SubcityDetailComponent implements OnInit {
  id: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
  }

  goBack(): void {
    this.router.navigate(['/subcities']);
  }
}
