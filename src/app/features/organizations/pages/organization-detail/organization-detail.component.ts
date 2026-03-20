import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { OrganizationViewComponent } from '../../components/organization-view/organization-view.component';

@Component({
  selector: 'app-organization-detail',
  standalone: true,
  imports: [PageHeaderComponent, OrganizationViewComponent],
  templateUrl: './organization-detail.component.html',
})
export class OrganizationDetailComponent implements OnInit {
  id: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
  }

  goBack(): void {
    this.router.navigate(['/organizations']);
  }
}
