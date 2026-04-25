import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './public-footer.component.html',
  styleUrl: './public-footer.component.css',
})
export class PublicFooterComponent {}

