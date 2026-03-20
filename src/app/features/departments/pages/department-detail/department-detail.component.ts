import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { DepartmentViewComponent } from '../../components/department-view/department-view.component';

@Component({
  selector: 'app-department-detail',
  standalone: true,
  imports: [PageHeaderComponent, DepartmentViewComponent],
  templateUrl: './department-detail.component.html',
})
export class DepartmentDetailComponent implements OnInit {
  id: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
  }

  goBack(): void {
    this.router.navigate(['/inventory/departments']);
  }
}

