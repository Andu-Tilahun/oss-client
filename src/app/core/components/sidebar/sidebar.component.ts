import {Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {CommonModule} from '@angular/common';
import {NavigationEnd, Router, RouterModule} from '@angular/router';
import {filter} from 'rxjs/operators';
import {MENU} from './menu';
import {AuthService} from '../../../features/auth/services/auth.service';
import {User} from '../../../features/users/models/user.model';
import {MenuItem} from './menu.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
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

  userAvatar(user: User | null): string {
    if (user?.profileUrl) {
      return user.profileUrl;
    }
    return this.fallbackAvatar(user);
  }

  /** If the profile image URL fails to load (expired, deleted, broken), swap in the generated fallback. */
  onAvatarError(event: Event, user: User | null): void {
    const img = event.target as HTMLImageElement;
    const fallback = this.fallbackAvatar(user);
    if (img.src !== fallback) {
      img.src = fallback;
    }
  }

  private fallbackAvatar(user: User | null): string {
    const name = user ? `${user.firstName}+${user.lastName}` : 'User';
    return `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff`;
  }

  userName(user: User | null): string {
    return user ? `${user.firstName} ${user.lastName}` : 'User';
  }

  userEmail(user: User | null): string {
    return user?.email || '';
  }

  ngOnInit() {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser = user;
        this.updateMenuItemsForUser();
      });
  }

  private updateMenuItemsForUser(): void {
    if (!this.currentUser) {
      this.visibleMenuItems = [];
      return;
    }

    const role = this.currentUser.role;

    this.visibleMenuItems = this.allMenuItems
      .filter(item => !item.roles || item.roles.includes(role))
      .map(item => ({
        ...item,
        children: item.children?.filter(child => !child.roles || child.roles.includes(role))
      }));
  }

  get menuItems(): MenuItem[] {
    return this.visibleMenuItems;
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
