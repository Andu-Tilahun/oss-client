import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {PublicHeaderComponent} from '../public-header/public-header.component';
import {PublicFooterComponent} from '../public-footer/public-footer.component';

@Component({
  selector: 'app-public-about-us',
  standalone: true,
  imports: [CommonModule, RouterModule, PublicHeaderComponent, PublicFooterComponent],
  templateUrl: './public-about-us.component.html',
  styleUrl: './public-about-us.component.css',
})
export class PublicAboutUsComponent {}

