import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailFieldComponent } from './detail-field.component';

describe('DetailFieldComponent', () => {
  let component: DetailFieldComponent;
  let fixture: ComponentFixture<DetailFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailFieldComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetailFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
