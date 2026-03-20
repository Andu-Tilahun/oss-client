import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {MENU} from './menu';
import {AuthService} from '../../../features/auth/services/auth.service';
import {User} from '../../../features/users/models/user.model';
import {MenuItem} from './menu.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;

  allMenuItems = MENU;
  /** Menu items filtered for the current user's role */
  visibleMenuItems: MenuItem[] = [];
  /** Menu items actually rendered in the template (after search filter) */
  displayedMenuItems: MenuItem[] = [];
  currentUser: User | null = null;
  searchTerm = '';

  constructor(private authService: AuthService) {
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
