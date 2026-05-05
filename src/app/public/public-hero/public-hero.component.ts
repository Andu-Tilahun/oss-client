import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-public-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-hero.component.html',
  styleUrl: './public-hero.component.css',
})
export class PublicHeroComponent {
  @Output() exploreOpportunities = new EventEmitter<void>();

  onExploreOpportunities(): void {
    this.exploreOpportunities.emit();
  }
}
