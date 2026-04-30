import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CompanyProfile } from '../../features/farm-company/models/company-profile.model';

@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './public-footer.component.html',
  styleUrl: './public-footer.component.css',
})
export class PublicFooterComponent {
  @Input() company: CompanyProfile | null = null;

  @Output() homeClick = new EventEmitter<void>();
  @Output() aboutClick = new EventEmitter<void>();
  @Output() contactClick = new EventEmitter<void>();
}
