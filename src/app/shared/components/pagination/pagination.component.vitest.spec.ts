import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';

function make(inputs: Partial<PaginationComponent> = {}) {
  const component = new PaginationComponent();
  Object.assign(component, inputs);
  const emitted: unknown[] = [];
  component.pageChange.subscribe(e => emitted.push(e));
  return { component, emitted };
}

describe('PaginationComponent', () => {
  it('computes pages and the shown range', () => {
    const { component } = make({ total: 45, pageSize: 20, pageIndex: 3 });

    expect(component.totalPages).toBe(3);
    expect(component.startIndex).toBe(41);
    expect(component.endIndex).toBe(45);
  });

  it('reports an empty range and a single page when there is nothing to page', () => {
    const { component } = make({ total: 0 });

    expect(component.totalPages).toBe(1);
    expect(component.startIndex).toBe(0);
    expect(component.endIndex).toBe(0);
  });

  it('windows page numbers to five around the current page', () => {
    const { component } = make({ total: 200, pageSize: 20, pageIndex: 1 });
    expect(component.visiblePages).toEqual([1, 2, 3, 4, 5]);
    component.pageIndex = 6;
    expect(component.visiblePages).toEqual([4, 5, 6, 7, 8]);
    component.pageIndex = 10;
    expect(component.visiblePages).toEqual([6, 7, 8, 9, 10]);
  });

  it('shows fewer numbers when there are fewer than five pages', () => {
    const { component } = make({ total: 30, pageSize: 20 });
    expect(component.visiblePages).toEqual([1, 2]);
  });

  it('emits the new page with the current size, ignoring the current or out-of-range pages', () => {
    const { component, emitted } = make({ total: 100, pageSize: 20, pageIndex: 2 });

    component.onPageChange(2);
    component.onPageChange(0);
    component.onPageChange(6);
    component.onPageChange(3);

    expect(emitted).toEqual([{ pageIndex: 3, pageSize: 20 }]);
  });

  it('emits page 1 when the page size changes', () => {
    const { component, emitted } = make({ total: 100, pageSize: 20, pageIndex: 4 });

    component.onPageSizeChange({ target: { value: '50' } } as unknown as Event);

    expect(emitted).toEqual([{ pageIndex: 1, pageSize: 50 }]);
  });

  it('emits nothing while disabled', () => {
    const { component, emitted } = make({ total: 100, pageSize: 20, pageIndex: 1, disabled: true });

    component.onPageChange(2);
    component.onPageSizeChange({ target: { value: '50' } } as unknown as Event);

    expect(emitted).toEqual([]);
  });
});

function render(inputs: Partial<PaginationComponent> = {}) {
  TestBed.configureTestingModule({ imports: [PaginationComponent] });
  const fixture = TestBed.createComponent(PaginationComponent);
  Object.assign(fixture.componentInstance, { total: 45, pageSize: 20, pageIndex: 1 }, inputs);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('PaginationComponent layout', () => {
  it('puts the page size on the left, the range in the middle and the buttons on the right', () => {
    const { el } = render();

    const cells = Array.from(el.querySelector('nav > div')!.children);
    expect(cells).toHaveLength(3);
    expect(cells[0].querySelector('select')).not.toBeNull();
    expect(cells[1].textContent).toContain('Showing 1 to 20 of 45 results');
    expect(cells[2].querySelectorAll('button').length).toBeGreaterThanOrEqual(5);
  });

  it('keeps the range centred (empty left cell) when the size dropdown is hidden', () => {
    const { el } = render({ showPageSize: false });

    const cells = Array.from(el.querySelector('nav > div')!.children);
    expect(el.querySelector('select')).toBeNull();
    expect(cells).toHaveLength(3);
    expect(cells[1].textContent).toContain('Showing');
  });

  it('adds a current size that is not among the options', () => {
    const { el } = render({ pageSize: 15 });

    const select = el.querySelector('select')!;
    expect(Array.from(select.options).map(o => o.value)).toEqual(['10', '15', '20', '50', '100']);
    expect(select.value).toBe('15');
  });

  it('hides the size and range below lg by default, but not when collapseMetaOnMobile is off', () => {
    const collapsed = render().el;
    expect(collapsed.querySelector('select')!.closest('div')!.className).toContain('hidden lg:flex');
    expect(Array.from(collapsed.querySelector('nav > div')!.children)[1].className).toContain('hidden lg:block');

    TestBed.resetTestingModule();
    const open = render({ collapseMetaOnMobile: false }).el;
    expect(open.querySelector('select')!.closest('div')!.className).not.toContain('hidden');
    expect(Array.from(open.querySelector('nav > div')!.children)[1].className).not.toContain('hidden');
  });

  it('colours the active page by accent', () => {
    expect(render().el.querySelector('[aria-current="page"]')!.className).toContain('bg-blue-500');
    TestBed.resetTestingModule();
    expect(render({ accent: 'emerald' }).el.querySelector('[aria-current="page"]')!.className).toContain('bg-emerald-600');
  });

  it('emits page 1 with the new size when the select changes', () => {
    const { fixture, el } = render({ pageIndex: 2 });
    const emitted: unknown[] = [];
    fixture.componentInstance.pageChange.subscribe(e => emitted.push(e));

    const select = el.querySelector('select')!;
    select.value = '50';
    select.dispatchEvent(new Event('change'));

    expect(emitted).toEqual([{ pageIndex: 1, pageSize: 50 }]);
  });
});
