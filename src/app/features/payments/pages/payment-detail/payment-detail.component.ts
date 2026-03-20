import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { PaymentViewComponent } from '../../components/payment-view/payment-view.component';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [PageHeaderComponent, PaymentViewComponent],
  templateUrl: './payment-detail.component.html',
})
export class PaymentDetailComponent implements OnInit {
  id: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
  }

  goBack(): void {
    this.router.navigate(['/payments']);
  }
}
