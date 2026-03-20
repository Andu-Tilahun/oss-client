import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Workflow } from '../../models/workflow.model';
import { WorkflowService } from '../../services/workflow.service';
import { DetailCardComponent } from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import { DetailSectionComponent } from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import { DetailFieldComponent } from '../../../../shared/components/detail-field/detail-field/detail-field.component';

@Component({
  selector: 'app-workflow-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent],
  templateUrl: './workflow-view.component.html',
})
export class WorkflowViewComponent implements OnInit {
  @Input() id?: string;

  workflow: Workflow | null = null;
  loading = false;
  error: string | null = null;

  constructor(private workflowService: WorkflowService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.id) return;
    this.loading = true;
    this.error = null;
    this.workflowService.findById(this.id).subscribe({
      next: (w) => {
        this.workflow = w;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load workflow';
        this.workflow = null;
        this.loading = false;
      },
    });
  }
}
