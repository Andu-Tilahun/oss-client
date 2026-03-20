import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { AuditViewComponent } from '../../components/audit-view/audit-view.component';

@Component({
  selector: 'app-audit-detail',
  standalone: true,
  imports: [PageHeaderComponent, AuditViewComponent],
  templateUrl: './audit-detail.component.html',
})
export class AuditDetailComponent implements OnInit {
  id: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = idParam ? +idParam : null;
  }

  goBack(): void {
    this.router.navigate(['/audits']);
  }
}
