import {Component, HostListener, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FarmPlot} from '../../../farm-plots/models/farm-plot.model';
import {FarmPlotService} from '../../../farm-plots/services/farm-plot.service';
import {AuthService} from '../../../auth/services/auth.service';

@Component({
  selector: 'app-farm-lease-plot-detail',
  standalone: false,
  templateUrl: './farm-lease-plot-detail.component.html',
})
export class FarmLeasePlotDetailComponent implements OnInit {
  readonly plotId: string = this.route.snapshot.paramMap.get('id') ?? '';

  showCreateLeaseCta = false;
  showCreateModal = false;
  farmPlot: FarmPlot | null = null;

  constructor(
    private route: ActivatedRoute,
    private farmPlotService: FarmPlotService,
    private authService: AuthService,
    private router: Router
  ) {}

  get isInvestor(): boolean {
    return this.authService.isInvestor();
  }

  ngOnInit(): void {
    this.refreshCreateLeaseCta();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.refreshCreateLeaseCta();
  }

  private refreshCreateLeaseCta(): void {
    this.showCreateLeaseCta = this.isInvestor && window.innerWidth < 1020;
  }

  openCreateLeaseFromPlot(): void {
    if (this.farmPlot) {
      this.showCreateModal = true;
      return;
    }
    this.farmPlotService.getFarmPlotById(this.plotId).subscribe({
      next: (p) => {
        this.farmPlot = p;
        this.showCreateModal = true;
      },
    });
  }

  onLeaseCreated(): void {
    this.showCreateModal = false;
    void this.router.navigate(['/farm-leases']);
  }
}
