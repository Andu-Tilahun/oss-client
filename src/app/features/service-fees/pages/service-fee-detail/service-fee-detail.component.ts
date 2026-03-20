import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ServiceFeeViewComponent } from '../../components/service-fee-view/service-fee-view.component';

@Component({
  selector: 'app-service-fee-detail',
  standalone: true,
  imports: [PageHeaderComponent, ServiceFeeViewComponent],
  templateUrl: './service-fee-detail.component.html',
})
export class ServiceFeeDetailComponent implements OnInit {
  id: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
  }

  goBack(): void {
    this.router.navigate(['/service-fees']);
  }
}
