import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {FarmFollowupsRoutingModule} from './farm-followups-routing.module';
import {FarmFollowUpsComponent} from './pages/farm-followups/farm-followups.component';

@NgModule({
  declarations: [FarmFollowUpsComponent],
  imports: [CommonModule, ReactiveFormsModule, FarmFollowupsRoutingModule],
})
export class FarmFollowupsModule {}

