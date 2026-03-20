import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {animate, style, transition, trigger} from '@angular/animations';
import {Toast, ToastType} from "../toast.model";
import {ToastService} from "../toast.service";

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.css'],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({transform: 'translateX(100%)', opacity: 0}),
        animate('300ms ease-out', style({transform: 'translateX(0)', opacity: 1}))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({transform: 'translateX(100%)', opacity: 0}))
      ])
    ])
  ]
})
export class ToastContainerComponent implements OnInit {
  toasts: Toast[] = [];
  ToastType = ToastType;

  constructor(private toastService: ToastService) {
  }

  ngOnInit() {
    this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  dismiss(id: string) {
    this.toastService.dismiss(id);
  }

  getIcon(type: ToastType): string {
    switch (type) {
      case ToastType.SUCCESS:
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case ToastType.ERROR:
        return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      case ToastType.WARNING:
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
      case ToastType.INFO:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return '';
    }
  }

  getColorClasses(type: ToastType): string {
    switch (type) {
      case ToastType.SUCCESS:
        return 'bg-green-50 border-green-200 text-green-800';
      case ToastType.ERROR:
        return 'bg-red-50 border-red-200 text-red-800';
      case ToastType.WARNING:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case ToastType.INFO:
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  }

  getIconColorClass(type: ToastType): string {
    switch (type) {
      case ToastType.SUCCESS:
        return 'text-green-600';
      case ToastType.ERROR:
        return 'text-red-600';
      case ToastType.WARNING:
        return 'text-yellow-600';
      case ToastType.INFO:
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  }
}
