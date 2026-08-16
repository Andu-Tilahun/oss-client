import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {InvestmentPackageTypesRoutingModule} from './investment-package-types-routing.module';
import {SharedModule} from '../../shared/shared.module';
import {InvestmentPackageTypeListComponent} from './pages/investment-package-type-list/investment-package-type-list.component';
import {InvestmentPackageTypeCreateModalComponent} from './modals/investment-package-type-create-modal/investment-package-type-create-modal.component';
import {InvestmentPackageTypeEditModalComponent} from './modals/investment-package-type-edit-modal/investment-package-type-edit-modal.component';
import {InvestmentPackageTypeAdminActionModalComponent} from './modals/investment-package-type-admin-action-modal/investment-package-type-admin-action-modal.component';
import {PageSplitLayoutComponent} from '../../shared/components/page-split-layout/page-split-layout/page-split-layout.component';
import {InvestmentPackageTypeFilterComponent} from './pages/investment-package-type-filter/investment-package-type-filter.component';
import {InvestmentPackageTypeViewComponent} from './components/investment-package-type-view/investment-package-type-view.component';
import {TabsComponent} from "../../shared/tabs/app-tabs/app-tabs.component";
import {FarmPlotViewComponent} from "../farm-plots/components/farm-plot-view/farm-plot-view.component";
import {UserViewComponent} from "../users/components/user-view/user-view.component";
import {FarmFollowupsModule} from "../farm-followups/farm-followups.module";
import {
    ExtensionWorkerAssignModalComponent
} from "../extension-worker-assign-modal/extension-worker-assign-modal.component";
import {ModalComponent} from "../../shared/modals/modal/modal.component";
import {InvestmentPackageTypePlotDetailComponent} from './pages/investment-package-type-plot-detail/investment-package-type-plot-detail.component';
import {InvestmentPackageViewComponent} from '../investment-package/components/investment-package-view/investment-package-view.component';
import {InvestmentPackageDetailPanelComponent} from '../investment-package/components/investment-package-detail-panel/investment-package-detail-panel.component';
import {
  InvestmentPackageCreateInvestmentModalComponent
} from '../investment-package/modals/investment-package-create-investment-modal/investment-package-create-investment-modal.component';
import {InvestmentPackageEditModalComponent} from '../investment-package/modals/investment-package-edit-modal/investment-package-edit-modal.component';
import {
  InvestmentPackageTypeCloseModalComponent
} from './modals/investment-package-type-close-modal/investment-package-type-close-modal.component';
import {
  InvestmentPackageTypeCompleteModalComponent
} from './modals/investment-package-type-complete-modal/investment-package-type-complete-modal.component';
import {
  InvestmentPackageDeactivateModalComponent
} from './modals/investment-package-deactivate-modal/investment-package-deactivate-modal.component';

@NgModule({
  declarations: [
    InvestmentPackageTypeListComponent,
    InvestmentPackageTypePlotDetailComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    InvestmentPackageTypesRoutingModule,
    SharedModule,
    InvestmentPackageViewComponent,
    InvestmentPackageDetailPanelComponent,
    InvestmentPackageCreateInvestmentModalComponent,
    InvestmentPackageEditModalComponent,
    PageSplitLayoutComponent,
    InvestmentPackageTypeFilterComponent,
    InvestmentPackageTypeViewComponent,
    InvestmentPackageTypeCreateModalComponent,
    InvestmentPackageTypeEditModalComponent,
    InvestmentPackageTypeAdminActionModalComponent,
    TabsComponent,
    FarmPlotViewComponent,
    UserViewComponent,
    FarmFollowupsModule,
    ExtensionWorkerAssignModalComponent,
    ModalComponent,
    InvestmentPackageTypeCloseModalComponent,
    InvestmentPackageTypeCompleteModalComponent,
    InvestmentPackageDeactivateModalComponent,
  ],
})
export class InvestmentPackageTypesModule {}
