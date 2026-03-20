import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainingProgramCreateComponent } from './training-program-create.component';

describe('TrainingProgramCreateComponent', () => {
  let component: TrainingProgramCreateComponent;
  let fixture: ComponentFixture<TrainingProgramCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainingProgramCreateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TrainingProgramCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
