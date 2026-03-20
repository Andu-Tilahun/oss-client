import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { NotificationViewComponent } from '../../components/notification-view/notification-view.component';

@Component({
  selector: 'app-notification-detail',
  standalone: true,
  imports: [PageHeaderComponent, NotificationViewComponent],
  templateUrl: './notification-detail.component.html',
})
export class NotificationDetailComponent implements OnInit {
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
    this.router.navigate(['/notifications']);
  }
}
