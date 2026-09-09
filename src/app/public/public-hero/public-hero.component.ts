import { Component, ElementRef, EventEmitter, AfterViewInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-public-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-hero.component.html',
  styleUrl: './public-hero.component.css',
})
export class PublicHeroComponent implements AfterViewInit {
  @Output() exploreOpportunities = new EventEmitter<void>();
  @ViewChild('heroVideo') heroVideo!: ElementRef<HTMLVideoElement>;

  ngAfterViewInit(): void {
    this.heroVideo.nativeElement.playbackRate = 0.4;
  }

  onExploreOpportunities(): void {
    this.exploreOpportunities.emit();
  }
}
