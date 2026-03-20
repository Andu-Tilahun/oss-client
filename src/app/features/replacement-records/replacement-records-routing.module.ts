import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReplacementsComponent } from './pages/replacements/replacements.component';

const routes: Routes = [{ path: '', component: ReplacementsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReplacementRecordsRoutingModule {}

