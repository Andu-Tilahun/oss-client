import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { PublicGalleryComponent } from './public-gallery.component';
import { GalleryItem } from '../../features/system-config/models/gallery-item.model';
import { environment } from '../../../environments/environment';
import { Endpoints } from '../../core/endpoint/endpoint.model';

const MOCK_ITEMS: GalleryItem[] = [
  {
    id: 'item-1',
    title: 'Harvest season',
    description: 'Harvest description',
    mediaUuid: 'uuid-1',
    kind: 'IMAGE',
    visible: true,
    displayOrder: 0,
  },
  {
    id: 'item-2',
    title: 'Irrigation video',
    description: 'Irrigation description',
    mediaUuid: 'uuid-2',
    kind: 'VIDEO',
    visible: true,
    displayOrder: 1,
  },
];

function makeComponent(items: GalleryItem[] = MOCK_ITEMS) {
  const mockService = {
    getVisibleGalleryItems: vi.fn(() => of(items)),
  };
  const component = new PublicGalleryComponent(mockService as any);
  return { component, mockService };
}

describe('PublicGalleryComponent', () => {
  let component: PublicGalleryComponent;

  beforeEach(() => {
    ({ component } = makeComponent());
    component.ngOnInit();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('calls getVisibleGalleryItems on init', () => {
    const { component: c, mockService } = makeComponent();
    c.ngOnInit();
    expect(mockService.getVisibleGalleryItems).toHaveBeenCalled();
  });

  it('maps IMAGE kind to lowercase image with resolved src', () => {
    const item = component.galleryItems.find((i) => i.id === 'item-1')!;
    expect(item.kind).toBe('image');
    expect(item.src).toBe(`${environment.apiUrl}${Endpoints.STORAGE_ENDPOINT}/uuid-1`);
    expect(item.title).toBe('Harvest season');
  });

  it('maps VIDEO kind to lowercase video with resolved src', () => {
    const item = component.galleryItems.find((i) => i.id === 'item-2')!;
    expect(item.kind).toBe('video');
    expect(item.src).toBe(`${environment.apiUrl}${Endpoints.STORAGE_ENDPOINT}/uuid-2`);
  });

  it('sets loading=false after successful load', () => {
    expect(component.loading).toBe(false);
    expect(component.error).toBe(false);
  });

  it('sets loading=false and error=true on failure', () => {
    const { component: c, mockService } = makeComponent();
    mockService.getVisibleGalleryItems.mockReturnValue(throwError(() => new Error('fail')));
    c.ngOnInit();
    expect(c.loading).toBe(false);
    expect(c.error).toBe(true);
  });

  it('handles an empty gallery without crashing', () => {
    const { component: c } = makeComponent([]);
    c.ngOnInit();
    expect(c.galleryItems).toHaveLength(0);
    expect(c.activeItem).toBeNull();
  });

  it('openDetail sets activeIndex and shows the modal', () => {
    component.openDetail(1);
    expect(component.activeIndex).toBe(1);
    expect(component.showDetailModal).toBe(true);
    expect(component.activeItem?.id).toBe('item-2');
  });

  it('closeDetail hides the modal', () => {
    component.openDetail(0);
    component.closeDetail();
    expect(component.showDetailModal).toBe(false);
    expect(component.activeItem).toBeNull();
  });

  it('goNext wraps around to the first item', () => {
    component.openDetail(1);
    component.goNext();
    expect(component.activeIndex).toBe(0);
  });

  it('goPrevious wraps around to the last item', () => {
    component.openDetail(0);
    component.goPrevious();
    expect(component.activeIndex).toBe(1);
  });
});
