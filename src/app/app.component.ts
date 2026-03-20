import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './core/components/sidebar/sidebar.component';
import { HeaderComponent } from './core/components/header/header.component';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';
import { AuthService } from './features/auth/services/auth.service';
import {ToastContainerComponent} from "./shared/toast/toast-container/toast-container.component";

@Component({
  selector: 'app-root',
  standalone: true,
    imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent, LoadingSpinnerComponent, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  showLayout = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.showLayout = this.authService.isLoggedIn();
    this.authService.currentUser$.subscribe(
      user => this.showLayout = !!user
    );
  }
}
