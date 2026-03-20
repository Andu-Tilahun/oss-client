import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FarmPlotsRoutingModule} from './farm-plots-routing.module';
import {SharedModule} from '../../shared/shared.module';
import {PageHeaderComponent} from '../../shared/components/page-header/page-header.component';
import {ConfirmationModalComponent} from '../../shared/modals/confirmation-modal/confirmation-modal.component';
import {FarmPlotFilterComponent} from './pages/farm-plot-filter/farm-plot-filter.component';
import {FarmPlotListComponent} from './pages/farm-plot-list/farm-plot-list.component';
import {FarmPlotCreateModalComponent} from './modals/farm-plot-create-modal/farm-plot-create-modal.component';
import {FarmPlotEditModalComponent} from './modals/farm-plot-edit-modal/farm-plot-edit-modal.component';

@NgModule({
  declarations: [FarmPlotListComponent],
  imports: [
    CommonModule,
    FarmPlotsRoutingModule,
    SharedModule,
    PageHeaderComponent,
    ConfirmationModalComponent,
    FarmPlotFilterComponent,
    FarmPlotCreateModalComponent,
    FarmPlotEditModalComponent,
  ],
})
export class FarmPlotsModule {}

