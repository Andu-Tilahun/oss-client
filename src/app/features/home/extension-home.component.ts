import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/services/auth.service';
import { User } from '../users/models/user.model';

@Component({
  selector: 'app-extension-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './extension-home.component.html',
})
export class ExtensionHomeComponent implements OnInit {
  currentUser?: User;
  greeting = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user || undefined;
    });
    this.setGreeting();
  }

  private setGreeting(): void {
    const hour = new Date().getHours();

    if (hour < 12) {
      this.greeting = 'Good Morning';
    } else if (hour < 18) {
      this.greeting = 'Good Afternoon';
    } else {
      this.greeting = 'Good Evening';
    }
  }
}
