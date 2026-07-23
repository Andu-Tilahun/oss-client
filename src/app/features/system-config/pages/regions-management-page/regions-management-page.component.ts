import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegionService } from '../../../regions/services/region.service';
import { Region } from '../../../regions/models/region.model';
import { ToastService } from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-regions-management-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './regions-management-page.component.html',
})
export class RegionsManagementPageComponent implements OnInit {
  regions: Region[] = [];
  loading = true;
  showModal = false;
  saving = false;
  deleting: string | null = null;
  editingId: string | null = null;

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private regionService: RegionService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
    });
    this.loadRegions();
  }

  loadRegions(): void {
    this.loading = true;
    this.regionService.filterRegions({ page: 0, size: 200 }).subscribe({
      next: (page) => {
        this.regions = page.content;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
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
      error: () => {
        this.saving = false;
      },
    });
  }

  onDelete(id: string): void {
    if (!confirm('Delete this region?')) return;
    this.deleting = id;
    this.regionService.deleteRegion(id).subscribe({
      next: () => {
        this.deleting = null;
        this.regions = this.regions.filter(r => r.id !== id);
        this.toastService.success('Region deleted');
      },
      error: () => {
        this.deleting = null;
      },
    });
  }
}
