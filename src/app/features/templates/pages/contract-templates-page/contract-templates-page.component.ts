import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SystemConfigService } from '../../../system-config/services/system-config.service';
import { ToastService } from '../../../../shared/toast/toast.service';
import {
  MessageTemplate, MessageTemplateRequest,
  PURPOSE_OPTIONS, PurposeOption, purposeLabel,
} from '../../../system-config/models/message-template.model';
import { DataTableColumn } from '../../../../shared/data-table/models/data-table-column.model';
import { PageSplitRightAction } from '../../../../shared/components/page-split-layout/page-split-layout/page-split-right-action.model';
import { SharedModule } from '../../../../shared/shared.module';
import { PageSplitLayoutComponent } from '../../../../shared/components/page-split-layout/page-split-layout/page-split-layout.component';

@Component({
  selector: 'app-contract-templates-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule, PageSplitLayoutComponent],
  templateUrl: './contract-templates-page.component.html',
})
export class ContractTemplatesPageComponent implements OnInit {
  templates: MessageTemplate[] = [];
  loading = true;
  saving = false;
  selectedTemplate: MessageTemplate | null = null;
  showModal = false;
  editingId: string | null = null;
  form!: FormGroup;

  readonly purposeOptions: PurposeOption[] = PURPOSE_OPTIONS['CONTRACT'];

  columns: DataTableColumn<MessageTemplate>[] = [
    { header: 'Name',    value: t => t.name },
    { header: 'Purpose', value: t => purposeLabel(t.purpose), hiddenBelowPx: 640 },
    { header: 'Status',  value: t => t.active ? 'Active' : 'Inactive' },
  ];

  rowActions: PageSplitRightAction<MessageTemplate>[] = [
    { id: 'edit',   icon: 'edit',   title: 'Edit',   action: t => this.openEdit(t) },
    { id: 'delete', icon: 'delete', title: 'Delete', action: t => this.delete(t.id) },
  ];

  constructor(private fb: FormBuilder, private service: SystemConfigService, private toastService: ToastService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name:            ['', Validators.required],
      purpose:         [null],
      subject:         [''],
      body:            ['', Validators.required],
      active:          [true],
      defaultTemplate: [false],
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.service.getTemplates('CONTRACT').subscribe({
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

  onRowClick(t: MessageTemplate): void { this.selectedTemplate = t; }

  openCreate(): void {
    this.editingId = null;
    this.form.reset({ active: true, defaultTemplate: false, name: '', purpose: null, subject: '', body: '' });
    this.showModal = true;
  }

  openEdit(t: MessageTemplate | null): void {
    if (!t) return;
    this.editingId = t.id;
    this.form.patchValue({ name: t.name, purpose: t.purpose || null, subject: t.subject || '', body: t.body, active: t.active, defaultTemplate: t.defaultTemplate });
    this.showModal = true;
  }

  save(): void {
    if (this.saving) {
      return; // a request is already in flight (e.g. Enter pressed again)
    }
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const request: MessageTemplateRequest = { ...this.form.value, type: 'CONTRACT' };
    const obs = this.editingId ? this.service.updateTemplate(this.editingId, request) : this.service.createTemplate(request);
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
}
