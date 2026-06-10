import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from './core/components/sidebar/sidebar.component';
import { HeaderComponent } from './core/components/header/header.component';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';
import { AuthService } from './features/auth/services/auth.service';
import {ToastContainerComponent} from "./shared/toast/toast-container/toast-container.component";
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
    imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent, LoadingSpinnerComponent, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  showLayout = false;
  /** Mobile-only: sidebar drawer open state (desktop uses persistent sidebar). */
  mobileSidebarOpen = false;
  private isAuthenticated = false;
  private currentUrl = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.currentUrl = this.router.url;
    this.syncAuthenticatedState();
    this.updateLayoutVisibility();
    this.restoreSessionIfNeeded();

    this.authService.currentUser$.subscribe(() => {
      this.syncAuthenticatedState();
      this.updateLayoutVisibility();
    });

    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      this.currentUrl = (event as NavigationEnd).urlAfterRedirects;
      this.updateLayoutVisibility();
    });
  }

  private syncAuthenticatedState(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
  }

  private restoreSessionIfNeeded(): void {
    if (this.authService.isSessionValid() || !this.authService.getRefreshToken()) {
      return;
    }

    this.authService.refreshSession().subscribe({
      next: () => {
        this.syncAuthenticatedState();
        this.updateLayoutVisibility();
      },
      error: () => {
        this.authService.clearSessionSilently();
        this.syncAuthenticatedState();
        this.updateLayoutVisibility();
      },
    });
  }

  private updateLayoutVisibility(): void {
    const publicRoutes = ['/public', '/login', '/forgot-password', '/reset-password'];
    const isPublicRoute = publicRoutes.some((route) => this.currentUrl.startsWith(route));
    this.showLayout = this.isAuthenticated && !isPublicRoute;
  }
}
