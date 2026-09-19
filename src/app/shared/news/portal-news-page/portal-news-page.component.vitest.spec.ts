import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { PortalNewsPageComponent } from './portal-news-page.component';
import { NewsArticle } from '../../../features/system-config/models/news-article.model';

function article(id: string): NewsArticle {
  return { id, title: `Article ${id}`, status: 'PUBLISHED', audience: 'PUBLIC' };
}

function mockPage(content: NewsArticle[], last: boolean) {
  return { content, totalElements: content.length, totalPages: last ? 1 : 2, number: 0, size: content.length, first: true, last };
}

function makeComponent() {
  const mockService = { getPortalNews: vi.fn() };
  const mockRouter = { navigate: vi.fn() };
  const mockRoute = {};
  const component = new PortalNewsPageComponent(mockService as any, mockRouter as any, mockRoute as any);
  return { component, mockService, mockRouter };
}

describe('PortalNewsPageComponent', () => {
  let component: PortalNewsPageComponent;
  let mockService: ReturnType<typeof makeComponent>['mockService'];

  beforeEach(() => {
    ({ component, mockService } = makeComponent());
  });

  it('should create', () => expect(component).toBeTruthy());

  it('loads the first page (20 items) on init', () => {
    const firstBatch = Array.from({ length: 20 }, (_, i) => article(`a${i}`));
    mockService.getPortalNews.mockReturnValue(of(mockPage(firstBatch, false)));

    component.ngOnInit();

    expect(mockService.getPortalNews).toHaveBeenCalledWith(0, 20);
    expect(component.articles).toHaveLength(20);
    expect(component.loading).toBe(false);
    expect(component.reachedEnd).toBe(false);
  });

  it('sets error and stops loading when the initial fetch fails', () => {
    mockService.getPortalNews.mockReturnValue(throwError(() => new Error('fail')));

    component.ngOnInit();

    expect(component.loading).toBe(false);
    expect(component.error).toBe(true);
  });

  it('onNearEnd appends the next page and advances the page index', () => {
    mockService.getPortalNews.mockReturnValueOnce(of(mockPage([article('a1'), article('a2')], false)));
    component.ngOnInit();

    mockService.getPortalNews.mockReturnValueOnce(of(mockPage([article('a3'), article('a4')], false)));
    component.onNearEnd();

    expect(mockService.getPortalNews).toHaveBeenNthCalledWith(2, 1, 20);
    expect(component.articles.map(a => a.id)).toEqual(['a1', 'a2', 'a3', 'a4']);
    expect(component.loadingMore).toBe(false);
    expect(component.reachedEnd).toBe(false);
  });

  it('onNearEnd stops requesting once the backend reports the last page', () => {
    mockService.getPortalNews.mockReturnValueOnce(of(mockPage([article('a1')], true)));
    component.ngOnInit();
    expect(component.reachedEnd).toBe(true);

    component.onNearEnd();

    expect(mockService.getPortalNews).toHaveBeenCalledTimes(1);
  });

  it('onNearEnd is a no-op while a fetch is already in flight', () => {
    mockService.getPortalNews.mockReturnValueOnce(of(mockPage([article('a1')], false)));
    component.ngOnInit();

    component.loadingMore = true;
    component.onNearEnd();

    expect(mockService.getPortalNews).toHaveBeenCalledTimes(1);
  });
});
