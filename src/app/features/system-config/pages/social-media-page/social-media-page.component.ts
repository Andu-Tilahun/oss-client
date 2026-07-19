import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SystemConfigService } from '../../services/system-config.service';
import { SocialMediaLink, SocialMediaPlatform } from '../../models/social-media.model';
import { ToastService } from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-social-media-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './social-media-page.component.html',
})
export class SocialMediaPageComponent implements OnInit {
  links: SocialMediaLink[] = [];
  loading = true;
  showModal = false;
  saving = false;
  togglingId: string | null = null;
  deletingId: string | null = null;
  editingId: string | null = null;

  form!: FormGroup;

  readonly platforms: SocialMediaPlatform[] = [
    'FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'LINKEDIN', 'X', 'TWITTER', 'TELEGRAM', 'WHATSAPP',
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
    this.systemConfigService.getAllSocialMedia().subscribe({
      next: (links) => {
        this.links = links;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
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
      error: () => {
        this.saving = false;
      },
    });
  }

  toggleVisible(link: SocialMediaLink): void {
    this.togglingId = link.id;
    this.systemConfigService.updateSocialMedia(link.id, { ...link, visible: !link.visible }).subscribe({
      next: () => {
        this.togglingId = null;
        link.visible = !link.visible;
      },
      error: () => {
        this.togglingId = null;
      },
    });
  }

  onDelete(id: string): void {
    if (!confirm('Delete this social media link?')) return;
    this.deletingId = id;
    this.systemConfigService.deleteSocialMedia(id).subscribe({
      next: () => {
        this.deletingId = null;
        this.links = this.links.filter(l => l.id !== id);
        this.toastService.success('Social media link deleted');
      },
      error: () => {
        this.deletingId = null;
      },
    });
  }
}
