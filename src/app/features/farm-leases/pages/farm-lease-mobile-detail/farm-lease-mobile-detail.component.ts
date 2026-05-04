import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {LeaseAgreement} from '../../models/farm-lease.model';
import {FarmLeaseService} from '../../services/farm-lease.service';

@Component({
  selector: 'app-farm-lease-mobile-detail',
  standalone: false,
  templateUrl: './farm-lease-mobile-detail.component.html',
})
export class FarmLeaseMobileDetailComponent implements OnInit {
  lease: LeaseAgreement | null = null;
  loading = false;
  error = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly farmLeaseService: FarmLeaseService
  ) {
  }

  ngOnInit(): void {
    const leaseId = this.route.snapshot.paramMap.get('id');
    if (!leaseId) {
      this.error = 'Lease not found.';
      return;
    }

    this.loading = true;
    this.farmLeaseService.getLeaseById(leaseId).subscribe({
      next: (res) => {
        this.lease = (res as unknown as LeaseAgreement) ?? null;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load lease detail.';
        this.loading = false;
      },
    });
  }
}
