import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtensionWorkerAssignModalComponent } from './extension-worker-assign-modal.component';

describe('ExtensionWorkerAssignModalComponent', () => {
  let component: ExtensionWorkerAssignModalComponent;
  let fixture: ComponentFixture<ExtensionWorkerAssignModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtensionWorkerAssignModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExtensionWorkerAssignModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
