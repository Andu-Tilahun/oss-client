import { Component, Input, Output, EventEmitter, TemplateRef, ContentChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.css']
})
export class PageHeaderComponent {
  constructor(private location: Location) {}

  // Input properties
  @Input() pageTitle: string = '';
  @Input() subTitle: string = '';
  @Input() showBackButton: boolean = false;
  @Input() showExtraContent: boolean = false;
  @Input() loading: boolean = false;
  @Input() noCard: boolean = false;

  // Content projections
  @ContentChild('extraContent') extraContent: TemplateRef<any> | null = null;
  @ContentChild('mainContent') mainContent: TemplateRef<any> | null = null;

  // Output events
  @Output() back = new EventEmitter<void>();

  goBack(): void {
    this.back.emit();
    this.location.back();
  }
}
