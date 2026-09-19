import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FarmPlotPreviewComponent } from './farm-plot-preview.component';

describe('FarmPlotPreviewComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmPlotPreviewComponent],
    }).compileComponents();
  });

  it('renders placeholders when no data has been entered yet', () => {
    const fixture = TestBed.createComponent(FarmPlotPreviewComponent);
    fixture.componentInstance.data = { galleryImages: [] };
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Untitled plot');
    expect(text).toContain('No description yet');
    expect(text).toContain('No image selected');
    expect((fixture.nativeElement as HTMLElement).querySelector('.leaflet-container')).toBeNull();
  });

  it('renders entered values live once data is populated', () => {
    const fixture = TestBed.createComponent(FarmPlotPreviewComponent);
    fixture.componentInstance.data = {
      title: 'North Field',
      description: 'A great plot',
      size: 10,
      sizeType: 'ACRES',
      latitude: 9.03,
      longitude: 38.74,
      soilType: 'LOAMY',
      status: 'ACTIVE',
      regionName: 'North Region',
      galleryImages: [{ id: 'g1', previewUrl: 'https://files/g1' }],
    };
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('North Field');
    expect(text).toContain('A great plot');
    expect(text).toContain('10 ACRES');
    expect(text).toContain('LOAMY');
    expect(text).toContain('ACTIVE');
    expect(text).toContain('North Region');
    expect(text).toContain('Gallery (1)');
    // Location is represented by the map, not raw coordinate text.
    expect(text).not.toContain('9.03');
    expect(text).not.toContain('38.74');
    expect((fixture.nativeElement as HTMLElement).querySelector('.leaflet-container')).not.toBeNull();
  });
});
