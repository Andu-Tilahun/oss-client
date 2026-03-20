import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Employee } from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';
import { DetailCardComponent } from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import { DetailSectionComponent } from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import { DetailFieldComponent } from '../../../../shared/components/detail-field/detail-field/detail-field.component';

@Component({
  selector: 'app-employee-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent],
  templateUrl: './employee-view.component.html',
})
export class EmployeeViewComponent implements OnInit {
  @Input() id?: string;

  employee: Employee | null = null;
  loading = false;
  error: string | null = null;

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.id) return;
    this.loading = true;
    this.error = null;
    this.employeeService.get(this.id).subscribe({
      next: (e: Employee) => {
        this.employee = e ?? null;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load employee';
        this.employee = null;
        this.loading = false;
      },
    });
  }
}

