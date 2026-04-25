import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {PublicHeaderComponent} from '../public-header/public-header.component';
import {PublicFooterComponent} from '../public-footer/public-footer.component';

@Component({
  selector: 'app-public-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, PublicHeaderComponent, PublicFooterComponent],
  templateUrl: './public-contact.component.html',
  styleUrl: './public-contact.component.css',
})
export class PublicContactComponent {}

