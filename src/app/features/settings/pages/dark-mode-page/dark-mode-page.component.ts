import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-dark-mode-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dark-mode-page.component.html',
})
export class DarkModePageComponent {
  constructor(public themeService: ThemeService) {}

  onToggle(): void {
    this.themeService.toggleTheme();
  }
}
