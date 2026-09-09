import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SystemConfigService } from '../../services/system-config.service';
import { SocialMediaLink, SocialMediaLinkFilterRequest, SocialMediaPlatform } from '../../models/social-media.model';
import { ToastService } from '../../../../shared/toast/toast.service';
import { PageSplitLayoutComponent } from '../../../../shared/components/page-split-layout/page-split-layout/page-split-layout.component';
import { SocialMediaViewComponent } from '../../components/social-media-view/social-media-view.component';
import { SocialMediaFilterComponent } from '../../components/social-media-filter/social-media-filter.component';
import { SharedModule } from '../../../../shared/shared.module';
import { DataTableColumn } from '../../../../shared/data-table/models/data-table-column.model';
import { ColumnType } from '../../../../shared/data-table/models/column-types.model';
import { TableQueryParams } from '../../../../shared/data-table/models/table-query-params.model';
import { PageSplitRightAction } from '../../../../shared/components/page-split-layout/page-split-layout/page-split-right-action.model';

@Component({
  selector: 'app-social-media-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule, PageSplitLayoutComponent, SocialMediaViewComponent, SocialMediaFilterComponent],
  templateUrl: './social-media-page.component.html',
})
export class SocialMediaPageComponent implements OnInit {
  links: SocialMediaLink[] = [];
  selectedLink: SocialMediaLink | null = null;
  detailRefreshKey = 0;

  loading = true;
  showModal = false;
  saving = false;
  togglingId: string | null = null;
  deletingId: string | null = null;
  editingId: string | null = null;

  total = 0;
  pageSize = 10;
  pageIndex = 1;
  searchText = '';
  selectedPlatform: SocialMediaPlatform | '' = '';

  form!: FormGroup;

  readonly platforms: SocialMediaPlatform[] = [
    'FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'LINKEDIN', 'X', 'TWITTER', 'TELEGRAM', 'WHATSAPP',
  ];

  columns: DataTableColumn<SocialMediaLink>[] = [
    { header: 'Platform', value: l => l.platform, cellClass: 'text-xs font-semibold text-gray-600 uppercase' },
    { header: 'URL', value: l => l.url, cellClass: 'text-blue-600' },
    { header: 'Order', value: l => l.displayOrder, hiddenBelowPx: 640 },
    {
      header: 'Visible', columnType: ColumnType.CHECK_BOX,
      defaultValue: l => l.visible, disabled: l => this.togglingId === l.id,
      columnAction: l => this.toggleVisible(l),
    },
  ];

  rowActions: PageSplitRightAction<SocialMediaLink>[] = [
    { id: 'edit', icon: 'edit', title: 'Edit', action: l => this.openEdit(l) },
    { id: 'delete', icon: 'delete', title: 'Delete', disabled: l => this.deletingId === l.id, action: l => this.onDelete(l.id) },
  ];

  constructor(
    private fb: FormBuilder,
    private systemConfigService: SystemConfigService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      platform:     ['FACEBOOK', Validators.required],
      url:          ['', [Validators.required, Validators.maxLength(500)]],
      visible:      [true],
      displayOrder: [0],
    });
    this.loadLinks();
  }

  loadLinks(): void {
    this.loading = true;
    const previousId = this.selectedLink?.id;
    const request: SocialMediaLinkFilterRequest = {
      searchText: this.searchText || undefined,
      platform: this.selectedPlatform || undefined,
      page: this.pageIndex - 1,
      size: this.pageSize,
    };
    this.systemConfigService.filterSocialMedia(request).subscribe({
      next: (page) => {
        this.links = page.content;
        this.total = page.totalElements;
        this.loading = false;
        if (this.links.length === 0) { this.selectedLink = null; return; }
        if (previousId) {
          const match = this.links.find(l => l.id === previousId);
          if (match) { this.selectedLink = { ...match }; return; }
        }
        this.selectedLink = { ...this.links[0] };
        this.detailRefreshKey++;
      },
      error: () => { this.loading = false; },
    });
  }

  onPageChange(params: TableQueryParams): void {
    this.pageIndex = params.pageIndex;
    this.pageSize = params.pageSize;
    this.loadLinks();
  }

  onSearch(): void {
    this.pageIndex = 1;
    this.loadLinks();
  }

  onFilterChange(): void {
    this.pageIndex = 1;
    this.loadLinks();
  }

  clearFilters(): void {
    this.pageIndex = 1;
    this.loadLinks();
  }

  onView(link: SocialMediaLink): void {
    this.selectedLink = { ...link };
  }

  openCreate(): void {
    this.editingId = null;
    this.form.reset({ platform: 'FACEBOOK', visible: true, displayOrder: 0 });
    this.showModal = true;
  }

  openEdit(link: SocialMediaLink): void {
    this.editingId = link.id;
    this.form.patchValue(link);
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
      ? this.systemConfigService.updateSocialMedia(this.editingId, request)
      : this.systemConfigService.createSocialMedia(request);

    call$.subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.loadLinks();
        this.toastService.success(this.editingId ? 'Social media link updated' : 'Social media link created');
      },
      error: () => { this.saving = false; },
    });
  }

  toggleVisible(link: SocialMediaLink): void {
    if (this.togglingId) {
      return; // a request is already in flight (e.g. Enter pressed again)
    }
    this.togglingId = link.id;
    const updated = { ...link, visible: !link.visible };
    this.systemConfigService.updateSocialMedia(link.id, updated).subscribe({
      next: () => {
        this.togglingId = null;
        link.visible = !link.visible;
        if (this.selectedLink?.id === link.id) this.selectedLink = { ...link };
      },
      error: () => { this.togglingId = null; },
    });
  }

  onDelete(id: string): void {
    if (this.deletingId) {
      return; // a request is already in flight (e.g. Enter pressed again)
    }
    if (!confirm('Delete this social media link?')) return;
    this.deletingId = id;
    this.systemConfigService.deleteSocialMedia(id).subscribe({
      next: () => {
        this.deletingId = null;
        if (this.selectedLink?.id === id) this.selectedLink = null;
        this.links = this.links.filter(l => l.id !== id);
        this.toastService.success('Social media link deleted');
      },
      error: () => { this.deletingId = null; },
    });
  }
}
