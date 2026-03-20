import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {AuthService} from '../../../features/auth/services/auth.service';
import {User} from '../../../features/users/models/user.model';
import {
  UserProfileModalComponent
} from "../../../features/users/modals/user-profile-modal/user-profile-modal.component";
import {FileUploadService} from "../../../shared/file-upload/file-upload.service";

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, UserProfileModalComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  currentUser$ = this.authService.currentUser$;
  showProfileMenu = false;
  showProfileEditModal = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private fileUploadService: FileUploadService
  ) {
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logged out successfully');
      },
      error: (error) => {
        console.error('Logout error:', error);
      }
    });
  }

  userAvatar(user: User | null): string {
    if (user?.profileImageUuid) {
      return this.fileUploadService.getFileUrl(user.profileImageUuid);
    }
    const name = user ? `${user.firstName}+${user.lastName}` : 'User';
    return `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff`;
  }

  userName(user: User | null): string {
    return user ? `${user.firstName} ${user.lastName}` : 'User';
  }

  userEmail(user: User | null): string {
    return user?.email || '';
  }

  openEditProfile() {
    this.showProfileMenu = false;
    this.showProfileEditModal = true;
  }

  onUserUpdated() {

  }
}
