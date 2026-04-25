// // ─── example-usage.component.ts ────────────────────────────────────────────
// import { Component, OnInit } from '@angular/core';
// import {AppGridConfig} from "./app-grid-config.model";
// import {ColumnType} from "../data-table/models/column-types.model";
// import {DataTableColumn} from "../data-table/models/data-table-column.model";
// import {TableQueryParams} from "../data-table/models/table-query-params.model";
//
// // ─── Domain models ──────────────────────────────────────────────────────────
// export interface Department {
//   id: number;
//   name: string;
//   location: string;
//   headCount: number;
//   budget: number;
//   status: 'Active' | 'Inactive';
//   employees: Employee[];
// }
//
// export interface Employee {
//   id: number;
//   name: string;
//   role: string;
//   email: string;
//   salary: number;
//   joinDate: string;
//   active: boolean;
// }
//
// // ─── Component ──────────────────────────────────────────────────────────────
// @Component({
//   selector: 'app-example-usage',
//   template: `
//     <div class="p-6">
//       <h1 class="text-2xl font-bold text-slate-800 mb-1">Departments</h1>
//       <p class="text-sm text-slate-500 mb-6">Click any row to expand and view employees.</p>
//
//       <app-grid
//         [data]="departments"
//         [total]="total"
//         [pageIndex]="pageIndex"
//         [pageSize]="pageSize"
//         [loading]="loading"
//         [config]="gridConfig"
//         [showIndex]="true"
//         [showAddButton]="true"
//         [showRefreshButton]="true"
//         [showExportButton]="true"
//         [showActionColumn]="true"
//         [showViewButton]="true"
//         [showEditButton]="true"
//         [showDeleteButton]="true"
//         [showColumnPickerControl]="true"
//         [childPageSize]="5"
//         (pageChange)="onPageChange($event)"
//         (addClick)="onAdd()"
//         (refreshClick)="onRefresh()"
//         (exportClick)="onExport()"
//         (viewClick)="onView($event)"
//         (editClick)="onEdit($event)"
//         (deleteClick)="onDelete($event)"
//         (childViewClick)="onChildView($event)"
//         (childEditClick)="onChildEdit($event)"
//         (childDeleteClick)="onChildDelete($event)"
//         (rowExpand)="onRowExpand($event)"
//         (rowCollapse)="onRowCollapse($event)"
//       >
//         <!-- Optional: project a search filter into the toolbar -->
//         <div extraTableHeader class="flex items-center gap-2">
//           <input
//             type="text"
//             placeholder="Search departments..."
//             class="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//             (input)="onSearch($event)"
//           />
//         </div>
//       </app-grid>
//     </div>
//   `,
// })
// export class ExampleUsageComponent implements OnInit {
//   departments: Department[] = [];
//   total = 0;
//   pageIndex = 1;
//   pageSize = 10;
//   loading = false;
//
//   // ── Grid configuration ─────────────────────────────────────────────────
//   gridConfig: AppGridConfig<Department, Employee> = {
//     // ── Parent columns ──────────────────────────────────────────────────
//     parentColumns: [
//       {
//         header: 'Department',
//         columnType: ColumnType.TEXT,
//         value: (dept) => dept.name,
//       },
//       {
//         header: 'Location',
//         value: (dept) => dept.location,
//       },
//       {
//         header: 'Head Count',
//         value: (dept) => dept.headCount,
//       },
//       {
//         header: 'Budget',
//         value: (dept) => `$${dept.budget.toLocaleString()}`,
//       },
//       {
//         header: 'Status',
//         columnType: ColumnType.BUTTON,
//         value: (dept) => dept.status,
//         columnAction: (dept) => console.log('Status clicked:', dept.name),
//       },
//     ] as DataTableColumn<Department>[],
//
//     // ── Child columns ───────────────────────────────────────────────────
//     childColumns: [
//       {
//         header: 'Name',
//         value: (emp) => emp.name,
//       },
//       {
//         header: 'Role',
//         value: (emp) => emp.role,
//       },
//       {
//         header: 'Email',
//         columnType: ColumnType.LINK,
//         value: (emp) => emp.email,
//         columnAction: (emp) => window.open(`mailto:${emp.email}`),
//       },
//       {
//         header: 'Salary',
//         value: (emp) => `$${emp.salary.toLocaleString()}`,
//       },
//       {
//         header: 'Join Date',
//         value: (emp) => emp.joinDate,
//       },
//       {
//         header: 'Active',
//         columnType: ColumnType.CHECK_BOX,
//         defaultValue: true,
//         disabled: true,
//         value: (emp) => emp.active,
//       },
//     ] as DataTableColumn<Employee>[],
//
//     // ── Child accessor ───────────────────────────────────────────────────
//     getChildren: (dept) => dept.employees,
//
//     // ── Child panel label ────────────────────────────────────────────────
//     childSectionLabel: (dept) => `Employees in ${dept.name}`,
//
//     // ── Track-by functions ───────────────────────────────────────────────
//     parentTrackBy: (dept) => dept.id,
//     childTrackBy: (emp) => emp.id,
//   };
//
//   ngOnInit(): void {
//     this.loadData();
//   }
//
//   private loadData(): void {
//     this.loading = true;
//
//     // Simulate HTTP call
//     setTimeout(() => {
//       this.departments = this.generateMockData();
//       this.total = this.departments.length;
//       this.loading = false;
//     }, 600);
//   }
//
//   // ── Event handlers ─────────────────────────────────────────────────────
//   onPageChange(params: TableQueryParams): void {
//     this.pageIndex = params.pageIndex;
//     this.pageSize = params.pageSize;
//     // re-fetch from API with new params
//     this.loadData();
//   }
//
//   onAdd(): void {
//     console.log('Add department clicked');
//   }
//
//   onRefresh(): void {
//     this.loadData();
//   }
//
//   onExport(): void {
//     console.log('Export clicked');
//   }
//
//   onView(dept: Department): void {
//     console.log('View department:', dept);
//   }
//
//   onEdit(dept: Department): void {
//     console.log('Edit department:', dept);
//   }
//
//   onDelete(dept: Department): void {
//     console.log('Delete department:', dept);
//   }
//
//   onChildView(event: { parent: Department; child: Employee }): void {
//     console.log('View employee:', event.child, 'in dept:', event.parent.name);
//   }
//
//   onChildEdit(event: { parent: Department; child: Employee }): void {
//     console.log('Edit employee:', event.child, 'in dept:', event.parent.name);
//   }
//
//   onChildDelete(event: { parent: Department; child: Employee }): void {
//     console.log('Delete employee:', event.child, 'in dept:', event.parent.name);
//   }
//
//   onRowExpand(dept: Department): void {
//     console.log('Row expanded:', dept.name);
//   }
//
//   onRowCollapse(dept: Department): void {
//     console.log('Row collapsed:', dept.name);
//   }
//
//   onSearch(event: Event): void {
//     const query = (event.target as HTMLInputElement).value;
//     console.log('Search:', query);
//     // Filter logic here
//   }
//
//   // ── Mock data ──────────────────────────────────────────────────────────
//   private generateMockData(): Department[] {
//     const roles = ['Engineer', 'Designer', 'Manager', 'Analyst', 'QA', 'DevOps'];
//     const depts = [
//       { name: 'Engineering', location: 'San Francisco', budget: 1_200_000 },
//       { name: 'Product Design', location: 'New York', budget: 800_000 },
//       { name: 'Marketing', location: 'Austin', budget: 650_000 },
//       { name: 'Finance', location: 'Chicago', budget: 900_000 },
//       { name: 'Human Resources', location: 'Remote', budget: 400_000 },
//       { name: 'Operations', location: 'Seattle', budget: 750_000 },
//       { name: 'Legal', location: 'Boston', budget: 550_000 },
//       { name: 'Customer Success', location: 'Denver', budget: 480_000 },
//     ];
//
//     return depts.map((d, i) => {
//       const empCount = Math.floor(Math.random() * 8) + 2;
//       const employees: Employee[] = Array.from({ length: empCount }, (_, j) => ({
//         id: i * 100 + j + 1,
//         name: `Employee ${j + 1}`,
//         role: roles[j % roles.length],
//         email: `emp${i * 100 + j + 1}@company.com`,
//         salary: Math.floor(Math.random() * 80_000) + 60_000,
//         joinDate: `202${Math.floor(Math.random() * 4)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-01`,
//         active: Math.random() > 0.15,
//       }));
//
//       return {
//         id: i + 1,
//         name: d.name,
//         location: d.location,
//         headCount: empCount,
//         budget: d.budget,
//         status: i % 5 === 0 ? 'Inactive' : 'Active',
//         employees,
//       };
//     });
//   }
// }
