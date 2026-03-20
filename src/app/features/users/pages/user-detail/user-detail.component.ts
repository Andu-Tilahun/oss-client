import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService} from '../../services/user.service';
import {User} from '../../models/user.model';
import {ApiResponse} from "../../../../shared/models/api-response.model";

@Component({
  selector: 'app-user-detail',
  standalone: false,
  templateUrl: './user-detail.component.html'
})
export class UserDetailComponent implements OnInit {
  user: User = {} as User;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {
  }

  ngOnInit() {
    const id = String(this.route.snapshot.params['id']);
    if (id) {
      this.loadUser(id);
    }
  }

  loadUser(id: string) {
    this.loading = true;
    this.userService.getUserById(id).subscribe({
      next: (user: User) => {
        if (user) {
          this.user = user;
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading user:', error);
        this.loading = false;
        this.router.navigate(['/users']);
      }
    });
  }

  goBack() {
    this.router.navigate(['/users']);
  }
}
