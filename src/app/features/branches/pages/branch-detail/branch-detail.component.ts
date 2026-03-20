import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BranchViewComponent } from '../../components/branch-view/branch-view.component';

@Component({
  selector: 'app-branch-detail',
  standalone: true,
  imports: [PageHeaderComponent, BranchViewComponent],
  templateUrl: './branch-detail.component.html',
})
export class BranchDetailComponent implements OnInit {
  id: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
  }

  goBack(): void {
    this.router.navigate(['/branches']);
  }
}
