import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { NewsManagementPageComponent } from './news-management-page.component';
import { NewsArticle } from '../../models/news-article.model';

const PUBLISHED_ARTICLE: NewsArticle = {
  id: 'news-uuid-1',
  title: 'Harvest season',
  summary: 'Summary',
  content: 'Content',
  category: 'Farming',
  publishedAt: '2026-01-15T00:00:00Z',
  status: 'PUBLISHED',
};

const DRAFT_ARTICLE: NewsArticle = {
  id: 'news-uuid-2',
  title: 'Upcoming event',
  status: 'DRAFT',
};

function mockPage(content: NewsArticle[]) {
  return { content, totalElements: content.length, totalPages: 1, number: 0, size: content.length || 10, first: true, last: true };
}

function makeComponent() {
  const mockService = {
    filterNews: vi.fn(() => of(mockPage([PUBLISHED_ARTICLE, DRAFT_ARTICLE]))),
    createNews: vi.fn(() => of({ success: true, data: PUBLISHED_ARTICLE })),
    updateNews: vi.fn(() => of({ success: true, data: PUBLISHED_ARTICLE })),
    deleteNews: vi.fn(() => of({ success: true })),
  };
  const mockToastService = { success: vi.fn(), error: vi.fn() };
  const component = new NewsManagementPageComponent(new FormBuilder(), mockService as any, mockToastService as any);
  component.ngOnInit();
  return { component, mockService };
}

describe('NewsManagementPageComponent', () => {
  let component: NewsManagementPageComponent;
  let mockService: ReturnType<typeof makeComponent>['mockService'];

  beforeEach(() => {
    ({ component, mockService } = makeComponent());
  });

  it('should create', () => expect(component).toBeTruthy());

  it('calls filterNews on init with default paging', () => {
    expect(mockService.filterNews).toHaveBeenCalledWith(expect.objectContaining({ page: 0, size: 10 }));
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

  it('onDelete calls deleteNews after confirm', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.onDelete('news-uuid-1');
    expect(mockService.deleteNews).toHaveBeenCalledWith('news-uuid-1');
  });

  it('onDelete does NOT call service when confirm is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.onDelete('news-uuid-1');
    expect(mockService.deleteNews).not.toHaveBeenCalled();
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

    it('Status column cellClass is green for PUBLISHED and gray for DRAFT', () => {
      const statusColumn = component.columns.find(c => c.header === 'Status')!;
      const cellClass = statusColumn.cellClass as (item: NewsArticle) => string;
      expect(cellClass(PUBLISHED_ARTICLE)).toContain('bg-green-100');
      expect(cellClass(DRAFT_ARTICLE)).toContain('bg-gray-100');
    });

    it('Category column falls back to an em-dash when missing', () => {
      const categoryColumn = component.columns.find(c => c.header === 'Category')!;
      expect(categoryColumn.value!(DRAFT_ARTICLE)).toBe('—');
    });

    it('rowActions edit/delete call the right handlers', () => {
      const editAction = component.rowActions.find(a => a.id === 'edit')!;
      const deleteAction = component.rowActions.find(a => a.id === 'delete')!;
      const openEditSpy = vi.spyOn(component, 'openEdit');
      const onDeleteSpy = vi.spyOn(component, 'onDelete');

      editAction.action(PUBLISHED_ARTICLE);
      expect(openEditSpy).toHaveBeenCalledWith(PUBLISHED_ARTICLE);

      deleteAction.action(PUBLISHED_ARTICLE);
      expect(onDeleteSpy).toHaveBeenCalledWith('news-uuid-1');
    });

    it('delete rowAction is disabled while that article is deleting', () => {
      component.deleting = 'news-uuid-1';
      const deleteAction = component.rowActions.find(a => a.id === 'delete')!;
      expect(deleteAction.disabled!(PUBLISHED_ARTICLE)).toBe(true);
      expect(deleteAction.disabled!(DRAFT_ARTICLE)).toBe(false);
    });
  });
});
