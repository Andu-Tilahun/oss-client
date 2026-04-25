import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FarmCompanyRoutingModule} from './farm-company-routing.module';
import {SharedModule} from '../../shared/shared.module';
import {PageSplitLayoutComponent} from '../../shared/components/page-split-layout/page-split-layout/page-split-layout.component';
import {CompanyProfilePageComponent} from './pages/company-profile-page/company-profile-page.component';
import {CompanyProfileFormComponent} from './components/company-profile-form/company-profile-form.component';
import {CompanyProfileViewComponent} from './components/company-profile-view/company-profile-view.component';

@NgModule({
  declarations: [CompanyProfilePageComponent],
  imports: [
    CommonModule,
    SharedModule,
    FarmCompanyRoutingModule,
    PageSplitLayoutComponent,
    CompanyProfileFormComponent,
    CompanyProfileViewComponent,
  ],
})
export class FarmCompanyModule {}
