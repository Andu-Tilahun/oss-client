import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SystemConfigService } from '../../services/system-config.service';
import { GalleryItem, GalleryItemFilterRequest, GalleryMediaKind } from '../../models/gallery-item.model';
import { ToastService } from '../../../../shared/toast/toast.service';
import { PageSplitLayoutComponent } from '../../../../shared/components/page-split-layout/page-split-layout/page-split-layout.component';
import { GalleryItemViewComponent } from '../../components/gallery-item-view/gallery-item-view.component';
import { GalleryMediaPickerComponent, GalleryMediaSelection } from '../../components/gallery-media-picker/gallery-media-picker.component';
import { GalleryFilterComponent } from '../../components/gallery-filter/gallery-filter.component';
import { environment } from '../../../../../environments/environment';
import { Endpoints } from '../../../../core/endpoint/endpoint.model';
import { SharedModule } from '../../../../shared/shared.module';
import { DataTableColumn } from '../../../../shared/data-table/models/data-table-column.model';
import { ColumnType } from '../../../../shared/data-table/models/column-types.model';
import { TableQueryParams } from '../../../../shared/data-table/models/table-query-params.model';
import { PageSplitRightAction } from '../../../../shared/components/page-split-layout/page-split-layout/page-split-right-action.model';

@Component({
  selector: 'app-gallery-management-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule, PageSplitLayoutComponent, GalleryItemViewComponent, GalleryMediaPickerComponent, GalleryFilterComponent],
  templateUrl: './gallery-management-page.component.html',
})
export class GalleryManagementPageComponent implements OnInit {
  items: GalleryItem[] = [];
  selectedItem: GalleryItem | null = null;
  detailRefreshKey = 0;

  loading = true;
  showModal = false;
  saving = false;
  deletingId: string | null = null;
  editingId: string | null = null;

  total = 0;
  pageSize = 10;
  pageIndex = 1;
  searchText = '';
  selectedKind: GalleryMediaKind | '' = '';

  form!: FormGroup;

  columns: DataTableColumn<GalleryItem>[] = [
    {
      header: 'Media', columnType: ColumnType.IMAGE,
      value: item => this.mediaUrl(item), imageAlt: item => item.title,
      mediaKind: item => item.kind === 'VIDEO' ? 'video' : 'image',
    },
    { header: 'Title', value: item => item.title, cellClass: 'font-medium text-gray-800' },
    { header: 'Kind', value: item => item.kind, hiddenBelowPx: 640 },
    {
      header: 'Visible', value: item => item.visible ? 'Visible' : 'Hidden',
      cellClass: item => item.visible
        ? 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700'
        : 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600',
    },
  ];

  rowActions: PageSplitRightAction<GalleryItem>[] = [
    { id: 'edit', icon: 'edit', title: 'Edit', action: item => this.openEdit(item) },
    { id: 'delete', icon: 'delete', title: 'Delete', disabled: item => this.deletingId === item.id, action: item => this.onDelete(item.id) },
  ];

  constructor(
    private fb: FormBuilder,
    private systemConfigService: SystemConfigService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadItems();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(300)]],
      description: ['', Validators.required],
      visible: [true],
      mediaUuid: ['', Validators.required],
      kind: [null as GalleryMediaKind | null, Validators.required],
    });
  }

  loadItems(): void {
    this.loading = true;
    const previousId = this.selectedItem?.id;
    const request: GalleryItemFilterRequest = {
      searchText: this.searchText || undefined,
      kind: this.selectedKind || undefined,
      page: this.pageIndex - 1,
      size: this.pageSize,
    };
    this.systemConfigService.filterGalleryItems(request).subscribe({
      next: (page) => {
        this.items = page.content;
        this.total = page.totalElements;
        this.loading = false;
        if (this.items.length === 0) { this.selectedItem = null; return; }
        if (previousId) {
          const match = this.items.find(i => i.id === previousId);
          if (match) { this.selectedItem = { ...match }; return; }
        }
        this.selectedItem = { ...this.items[0] };
        this.detailRefreshKey++;
      },
      error: () => { this.loading = false; },
    });
  }

  onPageChange(params: TableQueryParams): void {
    this.pageIndex = params.pageIndex;
    this.pageSize = params.pageSize;
    this.loadItems();
  }

  onSearch(): void {
    this.pageIndex = 1;
    this.loadItems();
  }

  onFilterChange(): void {
    this.pageIndex = 1;
    this.loadItems();
  }

  clearFilters(): void {
    this.pageIndex = 1;
    this.loadItems();
  }

  onView(item: GalleryItem): void {
    this.selectedItem = { ...item };
  }

  openCreate(): void {
    this.editingId = null;
    this.form.reset({ visible: true, mediaUuid: '', kind: null });
    this.showModal = true;
  }

  openEdit(item: GalleryItem): void {
    this.editingId = item.id;
    this.form.patchValue({
      title: item.title,
      description: item.description,
      visible: item.visible,
      mediaUuid: item.mediaUuid,
      kind: item.kind,
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  onMediaSelected(selection: GalleryMediaSelection): void {
    this.form.patchValue({ mediaUuid: selection.id, kind: selection.kind });
  }

  onSave(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.saving = true;
    const value = this.form.value;
    const request = {
      title: value.title,
      description: value.description,
      mediaUuid: value.mediaUuid,
      kind: value.kind as GalleryMediaKind,
      visible: value.visible,
    };

    const call$ = this.editingId
      ? this.systemConfigService.updateGalleryItem(this.editingId, request)
      : this.systemConfigService.createGalleryItem(request);

    call$.subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.loadItems();
        this.toastService.success(this.editingId ? 'Gallery item updated successfully' : 'Gallery item created successfully');
      },
      error: () => { this.saving = false; },
    });
  }

  onDelete(id: string): void {
    if (!confirm('Delete this gallery item?')) return;
    this.deletingId = id;
    this.systemConfigService.deleteGalleryItem(id).subscribe({
      next: () => {
        this.deletingId = null;
        if (this.selectedItem?.id === id) this.selectedItem = null;
        this.items = this.items.filter(i => i.id !== id);
        this.toastService.success('Gallery item deleted');
      },
      error: () => { this.deletingId = null; },
    });
  }

  mediaUrl(item: GalleryItem): string {
    return `${environment.apiUrl}${Endpoints.STORAGE_ENDPOINT}/${item.mediaUuid}`;
  }
}
