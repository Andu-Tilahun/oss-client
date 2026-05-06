import {Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {CommonModule} from '@angular/common';
import {NavigationEnd, Router, RouterModule} from '@angular/router';
import {filter} from 'rxjs/operators';
import {FormsModule} from '@angular/forms';
import {MENU} from './menu';
import {AuthService} from '../../../features/auth/services/auth.service';
import {User} from '../../../features/users/models/user.model';
import {MenuItem} from './menu.model';
import {FileUploadService} from '../../../shared/file-upload/file-upload.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() mobileOpen = false;
  @Output() mobileOpenChange = new EventEmitter<boolean>();

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  isCollapsed = false;

  allMenuItems = MENU;
  /** Menu items filtered for the current user's role */
  visibleMenuItems: MenuItem[] = [];
  /** Menu items actually rendered in the template (after search filter) */
  displayedMenuItems: MenuItem[] = [];
  currentUser: User | null = null;
  currentUser$ = this.authService.currentUser$;
  searchTerm = '';

  constructor(
    private authService: AuthService,
    private fileUploadService: FileUploadService
  ) {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        if (this.mobileOpen) {
          this.mobileOpenChange.emit(false);
        }
      });
  }

  closeMobileDrawer(): void {
    this.mobileOpenChange.emit(false);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => console.log('Logged out successfully'),
      error: (error) => console.error('Logout error:', error)
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

  openEditProfile(): void {
    this.closeMobileDrawer();
    void this.router.navigateByUrl('/profile');
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.updateMenuItemsForUser();
    });
  }

  private updateMenuItemsForUser(): void {
    if (!this.currentUser) {
      this.visibleMenuItems = [];
      this.displayedMenuItems = [];
      return;
    }

    const role = this.currentUser.role;

    this.visibleMenuItems = this.allMenuItems
      .filter(item => !item.roles || item.roles.includes(role))
      .map(item => ({
        ...item,
        children: item.children?.filter(child => !child.roles || child.roles.includes(role))
      }));

    // Initialize displayed items (no search applied yet)
    this.displayedMenuItems = this.visibleMenuItems;
  }

  get menuItems(): MenuItem[] {
    return this.displayedMenuItems;
  }

  getItemRoute(item: MenuItem): string {
    const role = this.currentUser?.role?.toUpperCase();
    // Investors and extension workers use role-specific farm-plot pages.
    if (item.route === '/farm-plots' && role === 'INVESTOR') {
      return '/farm-plots-explore';
    }
    if (item.route === '/farm-plots' && role === 'EXTENSION_WORKER') {
      return '/farm-plots-extension';
    }
    return item.route;
  }

  getItemFragment(item: MenuItem): string | undefined {
    return undefined;
  }

  applySearch(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      // Reset to all visible items and collapse submenus
      this.displayedMenuItems = this.visibleMenuItems;
      this.visibleMenuItems.forEach(item => (item.expanded = false));
      return;
    }

    this.displayedMenuItems = this.visibleMenuItems.filter(item => {
      const matchesParent = item.label.toLowerCase().includes(term);
      const hasMatchingChild = item.children?.some(child =>
        child.label.toLowerCase().includes(term)
      );

      const matches = matchesParent || !!hasMatchingChild;
      // Expand any menu that matches the search
      item.expanded = matches;
      return matches;
    });
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleSubmenu(item: MenuItem) {
    if (!item.children) {
      return;
    }

    // Close all other open submenus so only one is expanded at a time
    this.visibleMenuItems.forEach(menuItem => {
      if (menuItem !== item && menuItem.children) {
        menuItem.expanded = false;
      }
    });

    // Toggle the clicked submenu
    item.expanded = !item.expanded;
  }
}
