import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { User } from '../users/models/user.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  currentUser?: User;
  greeting: string = '';
  currentTime: Date = new Date();

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Get current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user || undefined;
    });

    // Set greeting based on time of day
    this.setGreeting();
  }

  setGreeting() {
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
