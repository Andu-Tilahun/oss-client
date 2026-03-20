import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Department } from '../../models/department.model';
import { DepartmentService } from '../../services/department.service';
import { DetailCardComponent } from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import { DetailSectionComponent } from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import { DetailFieldComponent } from '../../../../shared/components/detail-field/detail-field/detail-field.component';

@Component({
  selector: 'app-department-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent],
  templateUrl: './department-view.component.html',
})
export class DepartmentViewComponent implements OnInit {
  @Input() id?: string;

  department: Department | null = null;
  loading = false;
  error: string | null = null;

  constructor(private departmentService: DepartmentService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.id) return;
    this.loading = true;
    this.error = null;
    this.departmentService.get(this.id).subscribe({
      next: (d: Department) => {
        this.department = d ?? null;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load department';
        this.department = null;
        this.loading = false;
      },
    });
  }
}

