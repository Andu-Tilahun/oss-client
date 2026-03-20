import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {Toast, ToastType} from "./toast.model";

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$: Observable<Toast[]> = this.toastsSubject.asObservable();

  private defaultDuration = 5000; // 5 seconds


  success(message: string, title?: string, duration?: number): void {
    this.show({
      type: ToastType.SUCCESS,
      title: title || 'Success',
      message,
      duration: duration || this.defaultDuration,
      dismissible: true
    });
  }


  error(message: string, title?: string, duration?: number): void {
    this.show({
      type: ToastType.ERROR,
      title: title || 'Error',
      message,
      duration: duration || this.defaultDuration,
      dismissible: true
    });
  }


  warning(message: string, title?: string, duration?: number): void {
    this.show({
      type: ToastType.WARNING,
      title: title || 'Warning',
      message,
      duration: duration || this.defaultDuration,
      dismissible: true
    });
  }


  info(message: string, title?: string, duration?: number): void {
    this.show({
      type: ToastType.INFO,
      title: title || 'Info',
      message,
      duration: duration || this.defaultDuration,
      dismissible: true
    });
  }


  show(toast: Omit<Toast, 'id'>): void {
    const id = this.generateId();
    const newToast: Toast = {
      id,
      ...toast
    };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, newToast]);

    // Auto-dismiss after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, toast.duration);
    }
  }


  dismiss(id: string): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter(toast => toast.id !== id));
  }


  clear(): void {
    this.toastsSubject.next([]);
  }


  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
