import {Component, HostListener, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FarmPlot} from '../../../farm-plots/models/farm-plot.model';
import {FarmPlotService} from '../../../farm-plots/services/farm-plot.service';
import {AuthService} from '../../../auth/services/auth.service';

@Component({
  selector: 'app-investment-package-type-plot-detail',
  standalone: false,
  templateUrl: './investment-package-type-plot-detail.component.html',
})
export class InvestmentPackageTypePlotDetailComponent implements OnInit {
  readonly plotId: string = this.route.snapshot.paramMap.get('id') ?? '';

  showCreatePackageTypeCta = false;
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
    this.refreshCreatePackageTypeCta();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.refreshCreatePackageTypeCta();
  }

  private refreshCreatePackageTypeCta(): void {
    this.showCreatePackageTypeCta = this.isInvestor && window.innerWidth < 1020;
  }

  openCreatePackageTypeFromPlot(): void {
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

  onPackageTypeCreated(): void {
    this.showCreateModal = false;
    void this.router.navigate(['/investment-package-types/leasing']);
  }
}
