import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { HomeComponent } from './home.component';
import { AuthService } from '../auth/services/auth.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            currentUser$: of({ firstName: 'Test', role: 'ADMIN' }),
            isInvestor: () => false,
            getCurrentUser: () => ({ firstName: 'Test', role: 'ADMIN' }),
          },
        },
      ],
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
