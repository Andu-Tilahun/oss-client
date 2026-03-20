import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ReplacementRecordsRoutingModule } from './replacement-records-routing.module';
import { ReplacementsComponent } from './pages/replacements/replacements.component';
import { ReplacementModalComponent } from './modals/replacement-modal/replacement-modal.component';

@NgModule({
  declarations: [ReplacementsComponent],
  imports: [
    CommonModule,
    SharedModule,
    PageHeaderComponent,
    ReplacementRecordsRoutingModule,
    ReplacementModalComponent,
  ],
  exports: [ReplacementsComponent],
})
export class ReplacementRecordsModule {}

