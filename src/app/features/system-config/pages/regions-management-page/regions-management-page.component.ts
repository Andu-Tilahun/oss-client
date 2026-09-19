import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { deepLinkParam$ } from '../../../../shared/utils/deep-link.util';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegionService } from '../../../regions/services/region.service';
import { Region } from '../../../regions/models/region.model';
import { ToastService } from '../../../../shared/toast/toast.service';
import { PageSplitLayoutComponent } from '../../../../shared/components/page-split-layout/page-split-layout/page-split-layout.component';
import { RegionViewComponent } from '../../../regions/components/region-view/region-view.component';
import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar.component';
import { SharedModule } from '../../../../shared/shared.module';
import { DataTableColumn } from '../../../../shared/data-table/models/data-table-column.model';
import { TableQueryParams } from '../../../../shared/data-table/models/table-query-params.model';
import { PageSplitRightAction } from '../../../../shared/components/page-split-layout/page-split-layout/page-split-right-action.model';

@Component({
  selector: 'app-regions-management-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule, PageSplitLayoutComponent, RegionViewComponent, FilterBarComponent],
  templateUrl: './regions-management-page.component.html',
})
export class RegionsManagementPageComponent implements OnInit, OnDestroy {
  regions: Region[] = [];
  selectedRegion: Region | null = null;
  detailRefreshKey = 0;

  loading = true;
  showModal = false;
  saving = false;
  deleting: string | null = null;
  editingId: string | null = null;

  total = 0;
  pageSize = 10;
  pageIndex = 1;
  searchText = '';

  form!: FormGroup;

  columns: DataTableColumn<Region>[] = [
    { header: 'Name', value: r => r.name },
  ];

  rowActions: PageSplitRightAction<Region>[] = [
    { id: 'edit', icon: 'edit', title: 'Edit', action: r => this.openEdit(r) },
    { id: 'delete', icon: 'delete', title: 'Delete', disabled: r => this.deleting === r.id, action: r => this.onDelete(r.id) },
  ];

  constructor(
    private fb: FormBuilder,
    private regionService: RegionService,
    private toastService: ToastService,
    private route: ActivatedRoute,
  ) {}

  private deepLinkSub?: Subscription;
  private pendingDeepLink: Region | null = null;

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
    });
    // Subscribed (not a snapshot read) so a global-search click still opens the region when this
    // page is already open.
    this.deepLinkSub = deepLinkParam$(this.route).subscribe(id => this.openDeepLink(id));
    if (!this.route.snapshot.queryParamMap.get('id')) {
      this.loadRegions();
    }
  }

  ngOnDestroy(): void {
    this.deepLinkSub?.unsubscribe();
  }

  /** The farm-service has no get-region-by-id endpoint, so resolve the region from one large page
   *  (regions are a short reference list) and then select it in the table. */
  private openDeepLink(id: string): void {
    this.regionService.filterRegions({ page: 0, size: 500 }).subscribe({
      next: (page) => {
        const region = (page.content ?? []).find(r => r.id === id);
        if (region) {
          this.pendingDeepLink = region;
          this.loadRegions(id);
        } else {
          this.toastService.warning('Region not found — it may have been removed.');
          this.loadRegions();
        }
      },
      error: () => this.loadRegions(),
    });
  }

  loadRegions(selectId?: string): void {
    this.loading = true;
    const previousId = selectId ?? this.selectedRegion?.id;
    this.regionService.filterRegions({
      searchText: this.searchText || undefined,
      page: this.pageIndex - 1,
      size: this.pageSize,
    }).subscribe({
      next: (page) => {
        this.regions = page.content;
        this.total = page.totalElements;
        this.loading = false;
        const match = previousId
          ? this.regions.find(r => r.id === previousId)
            ?? (this.pendingDeepLink?.id === previousId ? this.pendingDeepLink : null)
          : null;
        if (match) {
          this.selectedRegion = { ...match };
          if (this.pendingDeepLink?.id === previousId) {
            this.detailRefreshKey++;
            this.pendingDeepLink = null;
          }
          return;
        }
        if (this.regions.length === 0) { this.selectedRegion = null; return; }
        this.selectedRegion = { ...this.regions[0] };
        this.detailRefreshKey++;
      },
      error: () => { this.loading = false; },
    });
  }

  onPageChange(params: TableQueryParams): void {
    this.pageIndex = params.pageIndex;
    this.pageSize = params.pageSize;
    this.loadRegions();
  }

  onSearch(): void {
    this.pageIndex = 1;
    this.loadRegions();
  }

  clearFilters(): void {
    this.searchText = '';
    this.pageIndex = 1;
    this.loadRegions();
  }

  onView(region: Region): void {
    this.selectedRegion = { ...region };
  }

  openCreate(): void {
    this.editingId = null;
    this.form.reset();
    this.showModal = true;
  }

  openEdit(region: Region): void {
    this.editingId = region.id;
    this.form.patchValue({ name: region.name });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  onSave(): void {
    if (this.saving) {
      return; // a request is already in flight (e.g. Enter pressed again)
    }
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const request = this.form.value;

    const call$ = this.editingId
      ? this.regionService.updateRegion(this.editingId, request)
      : this.regionService.createRegion(request);

    call$.subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.loadRegions();
        this.toastService.success(this.editingId ? 'Region updated' : 'Region created');
      },
      error: () => { this.saving = false; },
    });
  }

  onDelete(id: string): void {
    if (this.deleting) {
      return; // a request is already in flight (e.g. Enter pressed again)
    }
    if (!confirm('Delete this region?')) return;
    this.deleting = id;
    this.regionService.deleteRegion(id).subscribe({
      next: () => {
        this.deleting = null;
        if (this.selectedRegion?.id === id) this.selectedRegion = null;
        this.regions = this.regions.filter(r => r.id !== id);
        this.toastService.success('Region deleted');
      },
      error: () => { this.deleting = null; },
    });
  }
}
