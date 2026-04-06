import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {User} from '../../models/user.model';
import {DetailCardComponent} from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import {
  DetailSectionComponent
} from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import {DetailFieldComponent} from '../../../../shared/components/detail-field/detail-field/detail-field.component';
import {
  ProfilePictureUploadComponent
} from "../../../../shared/file-upload/profile-picture-upload/profile-picture-upload.component";
import {AuthService} from "../../../auth/services/auth.service";

@Component({
  selector: 'app-user-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent, ProfilePictureUploadComponent],
  templateUrl: './user-view.component.html',
})
export class UserViewComponent implements OnChanges {
  @Input() user: User | null = null;
  // List increments it to force a fresh selection.
  @Input() refreshKey = 0;

  loading = false;
  error: string | null = null;

  constructor(private authService: AuthService) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user']) {
      // This component renders from the passed-in `user` object (no extra API call),
      // so loading/error are effectively derived from presence of the input.
      this.loading = false;
      this.error = null;
    }
  }

  statusPillClass(isActive: boolean): string {
    return isActive
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-red-50 text-red-700 border-red-200';
  }

  get isAdmin() {
    return this.authService.isAdmin();
  }
}

