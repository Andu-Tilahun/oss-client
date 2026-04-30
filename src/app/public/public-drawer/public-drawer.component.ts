import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FarmPlot } from '../../features/farm-plots/models/farm-plot.model';

@Component({
  selector: 'app-public-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-drawer.component.html',
  styleUrl: './public-drawer.component.css',
})
export class PublicDrawerComponent implements OnChanges, OnDestroy {
  @Input() selectedPlot: FarmPlot | null = null;
  @Input() imageUrl: string | null = null;
  @Input() imageAlt = '';
  @Input() isOpen = false;

  @Output() close = new EventEmitter<void>();
  @Output() openGallery = new EventEmitter<void>();
  @Output() reserve = new EventEmitter<void>();

  private scrollPosition = 0;
  private bodyLocked = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['isOpen']) {
      return;
    }

    if (this.isOpen) {
      this.lockBodyScrollOnMobile();
      return;
    }

    this.restoreBodyScroll();
  }

  ngOnDestroy(): void {
    this.restoreBodyScroll();
  }

  private lockBodyScrollOnMobile(): void {
    if (this.bodyLocked || typeof window === 'undefined' || window.innerWidth > 720) {
      return;
    }

    this.scrollPosition = window.scrollY || window.pageYOffset || 0;
    const body = document.body;
    body.style.position = 'fixed';
    body.style.top = `-${this.scrollPosition}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    this.bodyLocked = true;
  }

  private restoreBodyScroll(): void {
    if (!this.bodyLocked || typeof window === 'undefined') {
      return;
    }

    const body = document.body;
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    body.style.overflow = '';
    window.scrollTo(0, this.scrollPosition);
    this.bodyLocked = false;
  }
}
