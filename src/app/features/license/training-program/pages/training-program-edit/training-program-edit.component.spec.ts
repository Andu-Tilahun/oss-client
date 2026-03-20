import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainingProgramEditComponent } from './training-program-edit.component';

describe('TrainingProgramEditComponent', () => {
  let component: TrainingProgramEditComponent;
  let fixture: ComponentFixture<TrainingProgramEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainingProgramEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TrainingProgramEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
