import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { RegionViewComponent } from '../../components/region-view/region-view.component';
import { RegionService } from '../../services/region.service';
import { Region } from '../../models/region.model';

@Component({
  selector: 'app-region-detail',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, RegionViewComponent],
  templateUrl: './region-detail.component.html',
})
export class RegionDetailComponent implements OnInit {
  region: Region | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private regionService: RegionService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.regionService.getRegionById(id).subscribe({
        next: (res) => { this.region = res?.data ?? null; },
        error: () => {},
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/regions']);
  }
}
