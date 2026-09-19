import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SharedModule } from '../../shared.module';
import { DataTableComponent } from '../../data-table/data-table.component';
import { DataCardLayoutComponent } from '../../data-card-layout/data-card-layout.component';
import { PublicCardLayoutComponent } from '../../public-card-layout/public-card-layout.component';

/** The list layouts must all render the one shared footer and re-emit its changes unchanged. */
describe.each([
  { name: 'DataTableComponent', component: DataTableComponent },
  { name: 'DataCardLayoutComponent', component: DataCardLayoutComponent },
  { name: 'PublicCardLayoutComponent', component: PublicCardLayoutComponent },
])('$name pagination', ({ component }) => {
  function render(props: Record<string, unknown>) {
    TestBed.configureTestingModule({ imports: [SharedModule] });
    const fixture = TestBed.createComponent(component as any) as any;
    Object.assign(fixture.componentInstance, { data: [{}], total: 45, pageSize: 20, pageIndex: 1, ...props });
    fixture.componentRef.changeDetectorRef.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, instance: fixture.componentInstance };
  }

  it('renders the shared app-pagination footer with the component state', () => {
    const { el } = render({});

    expect(el.querySelector('app-pagination')).not.toBeNull();
    expect(el.textContent).toContain('Showing 1 to 20 of 45 results');
  });

  it('re-emits a page change as pageIndex/pageSize', () => {
    const { el, instance, fixture } = render({});
    const emitted: unknown[] = [];
    instance.pageChange.subscribe((e: unknown) => emitted.push(e));

    Array.from(el.querySelectorAll<HTMLButtonElement>('app-pagination button'))
      .find(b => b.textContent?.trim() === '2')!.click();
    fixture.detectChanges();

    expect(emitted).toEqual([{ pageIndex: 2, pageSize: 20 }]);
    expect(instance.pageIndex).toBe(2);
  });

  it('re-emits a page-size change and returns to page 1', () => {
    const { el, instance } = render({ pageIndex: 2 });
    const emitted: unknown[] = [];
    instance.pageChange.subscribe((e: unknown) => emitted.push(e));

    const select = el.querySelector<HTMLSelectElement>('app-pagination select')!;
    select.value = '50';
    select.dispatchEvent(new Event('change'));

    expect(emitted).toEqual([{ pageIndex: 1, pageSize: 50 }]);
  });

  it('shows no footer when pagination is off or there is no data', () => {
    expect(render({ showPagination: false }).el.querySelector('app-pagination')).toBeNull();
    TestBed.resetTestingModule();
    expect(render({ data: [] }).el.querySelector('app-pagination')).toBeNull();
  });
});
