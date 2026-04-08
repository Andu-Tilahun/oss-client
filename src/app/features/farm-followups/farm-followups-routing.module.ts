import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {FarmFollowupsPageComponent} from './pages/farm-followups-page/farm-followups-page.component';

const routes: Routes = [
  {
    path: '',
    component: FarmFollowupsPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FarmFollowupsRoutingModule {}

