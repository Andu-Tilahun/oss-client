import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { NewsManagementPageComponent } from './news-management-page.component';
import { NewsArticle } from '../../models/news-article.model';
import { mockRouteWithQueryParams } from '../../../../shared/utils/deep-link.testing';

const PUBLISHED_ARTICLE: NewsArticle = {
  id: 'news-uuid-1',
  title: 'Harvest season',
  summary: 'Summary',
  content: 'Content',
  category: 'Farming',
  publishedAt: '2026-01-15T00:00:00Z',
  status: 'PUBLISHED',
  audience: 'PUBLIC',
};

const DRAFT_ARTICLE: NewsArticle = {
  id: 'news-uuid-2',
  title: 'Upcoming event',
  status: 'DRAFT',
  audience: 'PUBLIC',
};

const INACTIVE_ARTICLE: NewsArticle = {
  id: 'news-uuid-3',
  title: 'Shelved draft',
  status: 'INACTIVE',
  audience: 'PUBLIC',
};

function mockPage(content: NewsArticle[]) {
  // Shallow-clone each article so a test that mutates component.articles (e.g. deactivating one
  // in place) can't leak that mutation into the shared fixture constants used by other tests.
  const cloned = content.map(a => ({ ...a }));
  return { content: cloned, totalElements: cloned.length, totalPages: 1, number: 0, size: cloned.length || 10, first: true, last: true };
}

function makeComponent() {
  const mockService = {
    filterNews: vi.fn(() => of(mockPage([PUBLISHED_ARTICLE, DRAFT_ARTICLE]))),
    createNews: vi.fn(() => of({ success: true, data: PUBLISHED_ARTICLE })),
    updateNews: vi.fn(() => of({ success: true, data: PUBLISHED_ARTICLE })),
    deactivateNews: vi.fn(() => of({ success: true })),
    getNewsById: vi.fn(),
  };
  const mockToastService = { success: vi.fn(), error: vi.fn() };
  const routeMock = mockRouteWithQueryParams();
  const component = new NewsManagementPageComponent(new FormBuilder(), mockService as any, mockToastService as any, routeMock.route as any);
  component.ngOnInit();
  return { component, mockService, setQueryParams: routeMock.setQueryParams };
}

describe('NewsManagementPageComponent', () => {
  let component: NewsManagementPageComponent;
  let mockService: ReturnType<typeof makeComponent>['mockService'];

  beforeEach(() => {
    ({ component, mockService } = makeComponent());
  });

  it('should create', () => expect(component).toBeTruthy());

  it('calls filterNews on init with default paging, sorted by last edit', () => {
    expect(mockService.filterNews).toHaveBeenCalledWith(
      expect.objectContaining({ page: 0, size: 10, sortBy: 'modifiedDate', sortDirection: 'DESC' }),
    );
  });

  it('populates articles and auto-selects the first one', () => {
    expect(component.articles).toHaveLength(2);
    expect(component.selectedArticle?.id).toBe('news-uuid-1');
  });

  it('sets loading=false on load failure', () => {
    mockService.filterNews.mockReturnValue(throwError(() => new Error('fail')));
    component.loadArticles();
    expect(component.loading).toBe(false);
  });

  it('openCreate resets the form and clears editingId', () => {
    component.editingId = 'x';
    component.openCreate();
    expect(component.showModal).toBe(true);
    expect(component.editingId).toBeNull();
    expect(component.form.get('status')?.value).toBe('DRAFT');
  });

  it('openEdit patches the form from the article', () => {
    component.openEdit(PUBLISHED_ARTICLE);
    expect(component.editingId).toBe('news-uuid-1');
    expect(component.form.get('title')?.value).toBe('Harvest season');
    expect(component.form.get('status')?.value).toBe('PUBLISHED');
  });

  it('onSave calls createNews when creating', () => {
    component.openCreate();
    component.form.patchValue({ title: 'New article' });
    component.onSave();
    expect(mockService.createNews).toHaveBeenCalledWith(expect.objectContaining({ title: 'New article' }));
  });

  it('onSave calls updateNews when editingId is set', () => {
    component.openEdit(PUBLISHED_ARTICLE);
    component.form.patchValue({ title: 'Updated title' });
    component.onSave();
    expect(mockService.updateNews).toHaveBeenCalledWith('news-uuid-1', expect.objectContaining({ title: 'Updated title' }));
  });

  it('onDeactivate calls deactivateNews after confirm', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.onDeactivate('news-uuid-2');
    expect(mockService.deactivateNews).toHaveBeenCalledWith('news-uuid-2');
  });

  it('onDeactivate does NOT call service when confirm is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.onDeactivate('news-uuid-2');
    expect(mockService.deactivateNews).not.toHaveBeenCalled();
  });

  it('onDeactivate flips the article status to INACTIVE in place, not filtering it out', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.onDeactivate('news-uuid-2');
    expect(component.articles).toHaveLength(2);
    expect(component.articles.find(a => a.id === 'news-uuid-2')?.status).toBe('INACTIVE');
  });

  describe('search, filter and pagination', () => {
    it('onPageChange updates paging state and reloads', () => {
      component.onPageChange({ pageIndex: 3, pageSize: 20 });
      expect(component.pageIndex).toBe(3);
      expect(component.pageSize).toBe(20);
      expect(mockService.filterNews).toHaveBeenCalledWith(expect.objectContaining({ page: 2, size: 20 }));
    });

    it('onSearch resets to page 1 and includes searchText in the request', () => {
      component.pageIndex = 3;
      component.searchText = 'harvest';
      component.onSearch();
      expect(component.pageIndex).toBe(1);
      expect(mockService.filterNews).toHaveBeenCalledWith(expect.objectContaining({ searchText: 'harvest', page: 0 }));
    });

    it('onFilterChange includes the selected status in the request', () => {
      component.selectedStatus = 'PUBLISHED';
      component.onFilterChange();
      expect(mockService.filterNews).toHaveBeenCalledWith(expect.objectContaining({ status: 'PUBLISHED' }));
    });

    it('clearFilters reloads from page 1', () => {
      component.pageIndex = 2;
      component.clearFilters();
      expect(component.pageIndex).toBe(1);
      expect(mockService.filterNews).toHaveBeenCalled();
    });
  });

  describe('table columns config', () => {
    it('Status column value reflects the article status', () => {
      const statusColumn = component.columns.find(c => c.header === 'Status')!;
      expect(statusColumn.value!(PUBLISHED_ARTICLE)).toBe('PUBLISHED');
      expect(statusColumn.value!(DRAFT_ARTICLE)).toBe('DRAFT');
    });

    it('Status column cellClass is green for PUBLISHED, gray for DRAFT, red for INACTIVE', () => {
      const statusColumn = component.columns.find(c => c.header === 'Status')!;
      const cellClass = statusColumn.cellClass as (item: NewsArticle) => string;
      expect(cellClass(PUBLISHED_ARTICLE)).toContain('bg-green-100');
      expect(cellClass(DRAFT_ARTICLE)).toContain('bg-gray-100');
      expect(cellClass(INACTIVE_ARTICLE)).toContain('bg-red-100');
    });

    it('Category column falls back to an em-dash when missing', () => {
      const categoryColumn = component.columns.find(c => c.header === 'Category')!;
      expect(categoryColumn.value!(DRAFT_ARTICLE)).toBe('—');
    });

    it('rowActions edit/deactivate call the right handlers', () => {
      const editAction = component.rowActions.find(a => a.id === 'edit')!;
      const deactivateAction = component.rowActions.find(a => a.id === 'deactivate')!;
      const openEditSpy = vi.spyOn(component, 'openEdit');
      const onDeactivateSpy = vi.spyOn(component, 'onDeactivate');

      editAction.action(PUBLISHED_ARTICLE);
      expect(openEditSpy).toHaveBeenCalledWith(PUBLISHED_ARTICLE);

      deactivateAction.action(DRAFT_ARTICLE);
      expect(onDeactivateSpy).toHaveBeenCalledWith('news-uuid-2');
    });

    it('deactivate rowAction is only visible for DRAFT articles', () => {
      const deactivateAction = component.rowActions.find(a => a.id === 'deactivate')!;
      expect(deactivateAction.visible!(DRAFT_ARTICLE)).toBe(true);
      expect(deactivateAction.visible!(PUBLISHED_ARTICLE)).toBe(false);
      expect(deactivateAction.visible!(INACTIVE_ARTICLE)).toBe(false);
    });

    it('edit rowAction is hidden for INACTIVE articles', () => {
      const editAction = component.rowActions.find(a => a.id === 'edit')!;
      expect(editAction.visible!(DRAFT_ARTICLE)).toBe(true);
      expect(editAction.visible!(PUBLISHED_ARTICLE)).toBe(true);
      expect(editAction.visible!(INACTIVE_ARTICLE)).toBe(false);
    });

    it('deactivate rowAction is disabled while that article is deactivating', () => {
      component.deactivating = 'news-uuid-2';
      const deactivateAction = component.rowActions.find(a => a.id === 'deactivate')!;
      expect(deactivateAction.disabled!(DRAFT_ARTICLE)).toBe(true);
      expect(deactivateAction.disabled!(INACTIVE_ARTICLE)).toBe(false);
    });
  });
});

describe('NewsManagementPageComponent wizard', () => {
  afterEach(() => vi.useRealTimers());

  it('has five steps in order and opens on step 1 for create and edit', () => {
    const { component } = makeComponent();
    expect(component.steps.map(s => s.label)).toEqual(['Details', 'Content', 'Media', 'Publishing', 'Preview']);

    component.openCreate();
    expect(component.currentStep).toBe(1);
    component.openEdit(PUBLISHED_ARTICLE);
    expect(component.currentStep).toBe(1);
  });

  it('starts over at step 1 when re-opened after being cancelled on a later step', () => {
    const { component } = makeComponent();
    component.openCreate();
    component.currentStep = 4;

    component.closeModal();
    expect(component.currentStep).toBe(1);

    component.currentStep = 3;
    component.openCreate();
    expect(component.currentStep).toBe(1);
  });

  it('will not leave Details with a missing title, and shows why', () => {
    const { component } = makeComponent();
    component.openCreate();

    component.onNext();

    expect(component.currentStep).toBe(1);
    expect(component.titleError()).toBe('Title is required');
  });

  it('will not leave Details with a title or summary that is too long', () => {
    const { component } = makeComponent();
    component.openCreate();
    component.form.patchValue({ title: 'x'.repeat(301) });
    component.onNext();
    expect(component.currentStep).toBe(1);
    expect(component.titleError()).toBe('Max 300 characters');

    component.form.patchValue({ title: 'ok', summary: 'y'.repeat(601) });
    component.onNext();
    expect(component.currentStep).toBe(1);
    expect(component.summaryError()).toBe('Max 600 characters');
  });

  it('advances through every step once the title is valid', () => {
    const { component } = makeComponent();
    component.openCreate();
    component.form.patchValue({ title: 'A title' });

    for (const expected of [2, 3, 4, 5]) {
      component.onNext();
      expect(component.currentStep).toBe(expected);
    }
  });

  it('builds the preview from the unsaved form, including existing additional media when editing', () => {
    const { component } = makeComponent();
    const media = [{ id: 'm1', mediaUuid: 'u1', kind: 'IMAGE', sortOrder: 0 }] as any;
    component.openEdit({ ...PUBLISHED_ARTICLE, media });
    component.form.patchValue({ title: 'Edited title', content: 'Long\ncontent', category: 'Farming', audience: 'INVESTOR' });

    expect(component.previewArticle).toMatchObject({
      id: 'news-uuid-1',
      title: 'Edited title',
      content: 'Long\ncontent',
      category: 'Farming',
      audience: 'INVESTOR',
      status: 'PUBLISHED',
      media,
    });
  });

  it('previews a brand-new article with a placeholder title until one is typed', () => {
    const { component } = makeComponent();
    component.openCreate();

    expect(component.previewArticle.id).toBe('preview');
    expect(component.previewArticle.title).toBe('Untitled article');
    expect(component.previewArticle.status).toBe('DRAFT');
  });

  it('previews a future published date as Draft and explains the scheduling', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 19, 12, 0));
    const { component } = makeComponent();
    component.openCreate();
    component.form.patchValue({ title: 'Soon', status: 'PUBLISHED', publishedAt: '2026-10-01T09:00' });

    expect(component.isScheduled).toBe(true);
    expect(component.previewArticle.status).toBe('DRAFT');
    expect(component.scheduledNotice).toContain('published automatically');
  });

  it('shows no scheduling notice for a past date, no date, or a draft', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 19, 12, 0));
    const { component } = makeComponent();
    component.openCreate();

    component.form.patchValue({ title: 'Now', status: 'PUBLISHED', publishedAt: '2026-09-01T09:00' });
    expect(component.scheduledNotice).toBeNull();
    expect(component.previewArticle.status).toBe('PUBLISHED');

    component.form.patchValue({ publishedAt: '' });
    expect(component.scheduledNotice).toBeNull();

    component.form.patchValue({ status: 'DRAFT', publishedAt: '2026-10-01T09:00' });
    expect(component.scheduledNotice).toBeNull();
  });

  it('jumps back to Details and does not save when the form is invalid', () => {
    const { component, mockService } = makeComponent();
    component.openCreate();
    component.currentStep = 5;

    component.onSave();

    expect(component.currentStep).toBe(1);
    expect(mockService.createNews).not.toHaveBeenCalled();
  });

  it('does not save twice while a save is in flight', () => {
    const { component, mockService } = makeComponent();
    component.openCreate();
    component.form.patchValue({ title: 'Once' });
    component.saving = true;

    component.onSave();

    expect(mockService.createNews).not.toHaveBeenCalled();
  });
});

describe('NewsManagementPageComponent deep-link (?id=)', () => {
  it('selects an article that is not on the loaded page by fetching it by id', () => {
    const { component, mockService, setQueryParams } = makeComponent();
    mockService.getNewsById.mockReturnValue(of({ ...PUBLISHED_ARTICLE, id: 'far-away', title: 'Old story' }));

    setQueryParams({ id: 'far-away' });

    expect(mockService.getNewsById).toHaveBeenCalledWith('far-away');
    expect(component.selectedArticle?.id).toBe('far-away');
  });

  it('selects the article when it is on the loaded page', () => {
    const { component, mockService, setQueryParams } = makeComponent();
    mockService.getNewsById.mockReturnValue(of(DRAFT_ARTICLE));

    setQueryParams({ id: 'news-uuid-2' });

    expect(component.selectedArticle?.id).toBe('news-uuid-2');
  });

  it('re-selects when the id changes while the page is already open', () => {
    const { component, mockService, setQueryParams } = makeComponent();
    mockService.getNewsById.mockImplementation((id: string) => of({ ...PUBLISHED_ARTICLE, id }));

    setQueryParams({ id: 'a' });
    expect(component.selectedArticle?.id).toBe('a');
    setQueryParams({ id: 'b' });
    expect(component.selectedArticle?.id).toBe('b');
  });

  it('keeps the normal list selection when the by-id fetch fails', () => {
    const { component, mockService, setQueryParams } = makeComponent();
    mockService.getNewsById.mockReturnValue(throwError(() => new Error('404')));

    setQueryParams({ id: 'gone' });

    expect(component.selectedArticle?.id).toBe('news-uuid-1');
  });
});
