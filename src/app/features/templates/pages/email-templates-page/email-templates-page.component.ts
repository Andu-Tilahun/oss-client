import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SystemConfigService } from '../../../system-config/services/system-config.service';
import { ToastService } from '../../../../shared/toast/toast.service';
import {
  MessageTemplate, MessageTemplateRequest,
  PURPOSE_OPTIONS, PurposeOption, purposeLabel,
} from '../../../system-config/models/message-template.model';
import { OrganizationConfig } from '../../../system-config/models/organization-config.model';
import { DataTableColumn } from '../../../../shared/data-table/models/data-table-column.model';
import { PageSplitRightAction } from '../../../../shared/components/page-split-layout/page-split-layout/page-split-right-action.model';
import { SharedModule } from '../../../../shared/shared.module';
import { PageSplitLayoutComponent } from '../../../../shared/components/page-split-layout/page-split-layout/page-split-layout.component';

@Component({
  selector: 'app-email-templates-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule, PageSplitLayoutComponent],
  templateUrl: './email-templates-page.component.html',
})
export class EmailTemplatesPageComponent implements OnInit {
  templates: MessageTemplate[] = [];
  loading = true;
  saving = false;

  selectedTemplate: MessageTemplate | null = null;
  showModal = false;
  editingId: string | null = null;
  form!: FormGroup;
  previewHtml: SafeHtml = '';

  orgConfig: OrganizationConfig | null = null;

  readonly purposeOptions: PurposeOption[] = PURPOSE_OPTIONS['EMAIL'];

  columns: DataTableColumn<MessageTemplate>[] = [
    { header: 'Name',    value: t => t.name },
    { header: 'Purpose', value: t => purposeLabel(t.purpose), hiddenBelowPx: 640 },
    { header: 'Status',  value: t => t.active ? 'Active' : 'Inactive' },
  ];

  rowActions: PageSplitRightAction<MessageTemplate>[] = [
    { id: 'edit',   icon: 'edit',   title: 'Edit',   action: t => this.openEdit(t) },
    { id: 'delete', icon: 'delete', title: 'Delete', action: t => this.delete(t.id) },
  ];

  constructor(
    private fb: FormBuilder,
    private service: SystemConfigService,
    private sanitizer: DomSanitizer,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name:            ['', Validators.required],
      purpose:         [null],
      subject:         [''],
      variables:       [''],
      body:            ['', Validators.required],
      active:          [true],
      defaultTemplate: [false],
    });

    this.form.get('body')?.valueChanges.subscribe(val => {
      this.previewHtml = this.getPreviewHtml(val || '');
    });

    this.service.getOrganizationConfig().subscribe({
      next: cfg => { this.orgConfig = cfg; },
    });

    this.load();
  }

  load(): void {
    this.loading = true;
    this.service.getTemplates('EMAIL').subscribe({
      next: (list) => {
        this.templates = list;
        this.loading = false;
        if (!this.selectedTemplate && list.length > 0) {
          this.selectedTemplate = list[0];
        }
      },
      error: () => { this.loading = false; },
    });
  }

  onRowClick(t: MessageTemplate): void {
    this.selectedTemplate = t;
  }

  getPreviewHtml(body: string): SafeHtml {
    const orgName  = this.orgConfig?.name  || 'Organization';
    const logoUrl  = this.orgConfig?.logoUuid ? `/api/files/${this.orgConfig.logoUuid}` : '';
    const orgEmail = this.orgConfig?.email || '';
    const orgPhone = this.orgConfig?.phone || this.orgConfig?.contactMobilePhone || '';

    const substituted = (body || '')
      .replace(/\{\{orgName\}\}/g,  orgName)
      .replace(/\{\{logoUrl\}\}/g,  logoUrl)
      .replace(/\{\{orgEmail\}\}/g, orgEmail)
      .replace(/\{\{orgPhone\}\}/g, orgPhone);

    return this.sanitizer.bypassSecurityTrustHtml(substituted);
  }

  openCreate(): void {
    this.editingId = null;
    const sampleBody = this.buildSampleHtml();
    this.form.reset({ active: true, defaultTemplate: false, name: '', purpose: null, subject: '', variables: '', body: sampleBody });
    this.previewHtml = this.getPreviewHtml(sampleBody);
    this.showModal = true;
  }

  openEdit(t: MessageTemplate | null): void {
    if (!t) return;
    this.editingId = t.id;
    this.form.patchValue({
      name: t.name, purpose: t.purpose || null, subject: t.subject || '',
      variables: this.variablesToText(t.variables),
      body: t.body, active: t.active, defaultTemplate: t.defaultTemplate,
    });
    this.previewHtml = this.getPreviewHtml(t.body);
    this.showModal = true;
  }

  private variablesToText(json?: string): string {
    if (!json) return '';
    try {
      const arr = JSON.parse(json);
      return Array.isArray(arr) ? arr.join(', ') : '';
    } catch {
      return '';
    }
  }

  private variablesToJson(text?: string): string {
    const names = (text || '').split(',').map(s => s.trim()).filter(Boolean);
    return JSON.stringify(names);
  }

  save(): void {
    if (this.saving) {
      return; // a request is already in flight (e.g. Enter pressed again)
    }
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const request: MessageTemplateRequest = {
      ...this.form.value,
      type: 'EMAIL',
      variables: this.variablesToJson(this.form.value.variables),
    };
    const obs = this.editingId
      ? this.service.updateTemplate(this.editingId, request)
      : this.service.createTemplate(request);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.load();
        this.toastService.success(this.editingId ? 'Template updated successfully' : 'Template created successfully');
      },
      error: () => { this.saving = false; },
    });
  }

  delete(id: string): void {
    if (!confirm('Delete this template?')) return;
    this.service.deleteTemplate(id).subscribe({
      next: () => {
        if (this.selectedTemplate?.id === id) this.selectedTemplate = null;
        this.load();
        this.toastService.success('Template deleted');
      },
      error: () => {},
    });
  }

  close(): void { this.showModal = false; }

  buildSampleHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to {{orgName}}</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f6f9; font-family: Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #1a6b3c; padding: 32px 40px; text-align: center; }
    .header img { max-height: 60px; }
    .header h1 { color: #ffffff; font-size: 22px; margin: 16px 0 0; }
    .body { padding: 36px 40px; color: #333333; font-size: 15px; line-height: 1.6; }
    .body h2 { font-size: 20px; color: #1a6b3c; margin-bottom: 8px; }
    .credentials { background: #f0f7f3; border: 1px solid #c3dfd0; border-radius: 6px; padding: 20px 24px; margin: 24px 0; }
    .credentials table { width: 100%; border-collapse: collapse; }
    .credentials td { padding: 6px 0; font-size: 15px; }
    .credentials td:first-child { color: #555; width: 110px; }
    .credentials td:last-child { font-weight: bold; color: #111; }
    .btn-wrap { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background: #1a6b3c; color: #ffffff !important; text-decoration: none; padding: 13px 32px; border-radius: 6px; font-size: 15px; font-weight: bold; letter-spacing: 0.3px; }
    .footer { background: #f4f6f9; border-top: 1px solid #e0e0e0; padding: 20px 40px; text-align: center; font-size: 12px; color: #888; }
    .footer a { color: #1a6b3c; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <img src="{{logoUrl}}" alt="{{orgName}} Logo"/>
      <h1>Welcome to {{orgName}}</h1>
    </div>
    <div class="body">
      <h2>Hello, {{firstName}}!</h2>
      <p>Your account has been created by an administrator on the <strong>{{orgName}} Agricultural Platform</strong>. You can now sign in and start exploring.</p>
      <div class="credentials">
        <table>
          <tr><td>Username:</td><td>{{username}}</td></tr>
          <tr><td>Password:</td><td>{{password}}</td></tr>
        </table>
      </div>
      <p>We strongly recommend changing your password after your first login.</p>
      <div class="btn-wrap">
        <a href="{{accessUrl}}" class="btn">Access the Platform</a>
      </div>
      <p style="font-size:13px; color:#777;">If the button above does not work, copy and paste this link into your browser:<br/>
        <a href="{{accessUrl}}" style="color:#1a6b3c;">{{accessUrl}}</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; {{orgName}} &bull; <a href="mailto:{{orgEmail}}">{{orgEmail}}</a> &bull; {{orgPhone}}</p>
    </div>
  </div>
</body>
</html>`;
  }
}
