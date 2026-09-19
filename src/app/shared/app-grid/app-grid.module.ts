import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppGridComponent } from './app-grid.component';
import { PaginationComponent } from '../components/pagination/pagination.component';

@NgModule({
  declarations: [AppGridComponent],
  imports: [CommonModule, PaginationComponent],
  exports: [AppGridComponent],
})
export class AppGridModule {}
