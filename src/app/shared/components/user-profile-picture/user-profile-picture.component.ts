import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../features/users/services/user.service';
import { ProfilePictureUploadComponent } from '../../file-upload/profile-picture-upload/profile-picture-upload.component';
import { ApiResponse } from '../../models/api-response.model';
import { User } from '../../../features/users/models/user.model';

/**
 * Wraps app-profile-picture-upload and loads the user by id from UserService.
 * Passes the user's profileImageUuid to the upload component as currentFileId.
 */
@Component({
  selector: 'app-user-profile-picture',
  standalone: true,
  imports: [CommonModule, ProfilePictureUploadComponent],
  templateUrl: './user-profile-picture.component.html',
  styleUrls: ['./user-profile-picture.component.css']
})
export class UserProfilePictureComponent implements OnChanges {
  /** User id (assignedToId, log.userId, etc.). Fetches user and shows profile image. */
  @Input() userId?: string | number | null;
  @Input() size: 'small' | 'medium' | 'large' = 'small';
  @Input() viewOnly = true;

  profileImageUuid?: string;

  constructor(private userService: UserService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId']) {
      this.loadUserProfile();
    }
  }

  private loadUserProfile(): void {
    const id = this.userId == null || this.userId === '' ? undefined : String(this.userId);
    if (id == null) {
      this.profileImageUuid = undefined;
      return;
    }
    this.userService.getUserById(id).subscribe({
      next: (res: User) => {
        if (res && res.profileImageUuid) {
          this.profileImageUuid = res.profileImageUuid;
        } else {
          this.profileImageUuid = undefined;
        }
      },
      error: () => {
        this.profileImageUuid = undefined;
      }
    });
  }
}
