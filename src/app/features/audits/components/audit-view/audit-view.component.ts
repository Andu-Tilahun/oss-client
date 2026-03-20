import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditLog } from '../../models/audit.model';
import { AuditService } from '../../services/audit.service';
import { DetailCardComponent } from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import { DetailSectionComponent } from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import { DetailFieldComponent } from '../../../../shared/components/detail-field/detail-field/detail-field.component';

@Component({
  selector: 'app-audit-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent],
  templateUrl: './audit-view.component.html',
})
export class AuditViewComponent implements OnInit {
  @Input() id?: number;

  audit: AuditLog | null = null;
  loading = false;
  error: string | null = null;

  constructor(private auditService: AuditService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (this.id == null) return;
    this.loading = true;
    this.error = null;
    this.auditService.getAuditById(this.id).subscribe({
      next: (a) => {
        this.audit = a;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load audit log';
        this.audit = null;
        this.loading = false;
      },
    });
  }
}
