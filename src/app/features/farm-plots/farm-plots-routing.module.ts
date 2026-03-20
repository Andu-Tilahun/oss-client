import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {FarmPlotListComponent} from './pages/farm-plot-list/farm-plot-list.component';

const routes: Routes = [
  {
    path: '',
    component: FarmPlotListComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FarmPlotsRoutingModule {}

