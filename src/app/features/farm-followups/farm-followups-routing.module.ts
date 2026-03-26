import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {FarmFollowUpsComponent} from './pages/farm-followups/farm-followups.component';

const routes: Routes = [
  {
    path: '',
    component: FarmFollowUpsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FarmFollowupsRoutingModule {}

