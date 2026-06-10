import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {of} from 'rxjs';

import {HeaderComponent} from './header.component';
import {NotificationLogService} from '../../../features/notifications/services/notification.service';
import {AuthService} from '../../../features/auth/services/auth.service';

const emptyPage = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: 10,
  number: 0,
  first: true,
  last: true,
};

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        {
          provide: NotificationLogService,
          useValue: {
            getNotifications: () => of(emptyPage),
          },
        },
        {
          provide: AuthService,
          useValue: {
            currentUser$: of(null),
            isSessionValid: () => false,
            isAuthenticated: () => false,
            ensureValidSession: () => of(void 0),
          },
        },
      ],
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
