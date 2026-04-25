import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {PublicHeaderComponent} from '../public-header/public-header.component';
import {PublicFooterComponent} from '../public-footer/public-footer.component';

@Component({
  selector: 'app-public-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, PublicHeaderComponent, PublicFooterComponent],
  templateUrl: './public-landing.component.html',
  styleUrl: './public-landing.component.css',
})
export class PublicLandingComponent {}

