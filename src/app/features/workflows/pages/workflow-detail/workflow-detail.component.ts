import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { WorkflowViewComponent } from '../../components/workflow-view/workflow-view.component';

@Component({
  selector: 'app-workflow-detail',
  standalone: true,
  imports: [PageHeaderComponent, WorkflowViewComponent],
  templateUrl: './workflow-detail.component.html',
})
export class WorkflowDetailComponent implements OnInit {
  id: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
  }

  goBack(): void {
    this.router.navigate(['/workflows']);
  }
}
