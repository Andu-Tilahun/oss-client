import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AuditService} from '../../services/audit.service';
import {AuditLog} from '../../models/audit.model';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {TableQueryParams} from '../../../../shared/data-table/models/table-query-params.model';
import {PageResponse} from '../../../../shared/models/api-response.model';
import {ToastService} from "../../../../shared/toast/toast.service";

@Component({
  selector: 'app-audit-list',
  standalone: false,
  templateUrl: './audit-list.component.html'
})
export class AuditListComponent implements OnInit {
  audits: AuditLog[] = [];
  loading = false;
  total = 0;
  pageSize = 10;
  pageIndex = 1;

  columns: DataTableColumn<AuditLog>[] = [
    {header: 'Entity Type', value: a => a.entityType},
    {header: 'Entity ID', value: a => a.entityId},
    {header: 'Action', value: a => a.action},
    {header: 'Created By', value: a => a.createdBy || '-'},
    {header: 'Created At', value: a => new Date(a.createdAt).toLocaleString()}
  ];

  constructor(
    private auditService: AuditService,
    private toastService: ToastService,
    private router: Router
  ) {}

  onView(audit: AuditLog): void {
    this.router.navigate(['/audits', audit.id]);
  }

  ngOnInit(): void {
    this.loadAudits();
  }

  loadAudits(): void {
    this.loading = true;
    this.auditService.getAllAudits(this.pageIndex - 1, this.pageSize).subscribe({
      next: (response: PageResponse<AuditLog>) => {
        if (response) {
          this.toastService.success(`Audit retrieved successfully`);
          this.audits = response.content;
          this.total = response.totalElements;
        }
        this.loading = false;
      },
      error: (error) => {
        this.toastService.error(
          error.message || 'Failed to fetch audits',
          'Fetch Audits'
        );
        this.loading = false;
      }
    });
  }

  onPageChange(params: TableQueryParams): void {
    this.pageIndex = params.pageIndex;
    this.pageSize = params.pageSize;
    this.loadAudits();
  }
}

