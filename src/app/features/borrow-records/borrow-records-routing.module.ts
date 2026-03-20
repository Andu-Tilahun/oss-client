import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReturnsComponent } from './pages/returns/returns.component';

const routes: Routes = [
  { path: '', component: ReturnsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BorrowRecordsRoutingModule {}

