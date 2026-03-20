import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { WoredaViewComponent } from '../../components/woreda-view/woreda-view.component';

@Component({
  selector: 'app-woreda-detail',
  standalone: true,
  imports: [PageHeaderComponent, WoredaViewComponent],
  templateUrl: './woreda-detail.component.html',
})
export class WoredaDetailComponent implements OnInit {
  id: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
  }

  goBack(): void {
    this.router.navigate(['/woredas']);
  }
}
