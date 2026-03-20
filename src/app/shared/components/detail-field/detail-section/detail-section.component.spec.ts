import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailSectionComponent } from './detail-section.component';

describe('DetailSectionComponent', () => {
  let component: DetailSectionComponent;
  let fixture: ComponentFixture<DetailSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailSectionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetailSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
