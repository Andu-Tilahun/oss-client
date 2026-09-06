import { describe, it, expect } from 'vitest';
import { DataTableComponent } from './data-table.component';
import { DataTableColumn } from './models/data-table-column.model';

interface Row {
  id: string;
  active: boolean;
}

function makeComponent(): DataTableComponent<Row> {
  const elRef = { nativeElement: document.createElement('div') } as any;
  const cdr = { markForCheck: () => undefined } as any;
  return new DataTableComponent<Row>(elRef, cdr);
}

const ROW: Row = { id: 'row-1', active: true };
const INACTIVE_ROW: Row = { id: 'row-2', active: false };

describe('DataTableComponent resolvers', () => {
  it('resolveCellClass returns a static string unchanged', () => {
    const component = makeComponent();
    const column: DataTableColumn<Row> = { header: 'Status', cellClass: 'text-blue-600' };
    expect(component.resolveCellClass(column, ROW)).toBe('text-blue-600');
  });

  it('resolveCellClass calls a function form with the row item', () => {
    const component = makeComponent();
    const column: DataTableColumn<Row> = {
      header: 'Status',
      cellClass: (item) => (item.active ? 'bg-green-100' : 'bg-gray-100'),
    };
    expect(component.resolveCellClass(column, ROW)).toBe('bg-green-100');
    expect(component.resolveCellClass(column, INACTIVE_ROW)).toBe('bg-gray-100');
  });

  it('resolveCellClass returns empty string when cellClass is omitted', () => {
    const component = makeComponent();
    const column: DataTableColumn<Row> = { header: 'Status' };
    expect(component.resolveCellClass(column, ROW)).toBe('');
  });

  it('resolveCheckboxChecked returns a static boolean unchanged', () => {
    const component = makeComponent();
    const column: DataTableColumn<Row> = { header: 'Active', defaultValue: true };
    expect(component.resolveCheckboxChecked(column, ROW)).toBe(true);
  });

  it('resolveCheckboxChecked calls a function form with the row item', () => {
    const component = makeComponent();
    const column: DataTableColumn<Row> = { header: 'Active', defaultValue: (item) => item.active };
    expect(component.resolveCheckboxChecked(column, ROW)).toBe(true);
    expect(component.resolveCheckboxChecked(column, INACTIVE_ROW)).toBe(false);
  });

  it('resolveCheckboxDisabled returns a static boolean unchanged', () => {
    const component = makeComponent();
    const column: DataTableColumn<Row> = { header: 'Active', disabled: true };
    expect(component.resolveCheckboxDisabled(column, ROW)).toBe(true);
  });

  it('resolveCheckboxDisabled calls a function form with the row item', () => {
    const component = makeComponent();
    const column: DataTableColumn<Row> = { header: 'Active', disabled: (item) => item.id === 'row-1' };
    expect(component.resolveCheckboxDisabled(column, ROW)).toBe(true);
    expect(component.resolveCheckboxDisabled(column, INACTIVE_ROW)).toBe(false);
  });
});

describe('DataTableComponent isRowSelected', () => {
  it('is false when selectedRowId is not set', () => {
    const component = makeComponent();
    expect(component.isRowSelected(ROW)).toBe(false);
  });

  it('is true when the default rowIdField (.id) matches selectedRowId', () => {
    const component = makeComponent();
    component.selectedRowId = 'row-1';
    expect(component.isRowSelected(ROW)).toBe(true);
    expect(component.isRowSelected(INACTIVE_ROW)).toBe(false);
  });

  it('uses a custom rowIdField when provided', () => {
    const component = makeComponent();
    component.selectedRowId = 'row-2';
    component.rowIdField = (item) => item.id;
    expect(component.isRowSelected(ROW)).toBe(false);
    expect(component.isRowSelected(INACTIVE_ROW)).toBe(true);
  });
});
