import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import * as XLSX from 'xlsx';
import {exportRowsToExcel} from './excel-export.util';

interface Row {
  name: string;
  age: number;
}

describe('exportRowsToExcel', () => {
  let clickSpy: ReturnType<typeof vi.fn>;
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') {
        (el as any).click = clickSpy;
      }
      return el;
    });
    createObjectURLSpy = vi.fn(() => 'blob:mock-url');
    revokeObjectURLSpy = vi.fn();
    (URL as any).createObjectURL = createObjectURLSpy;
    (URL as any).revokeObjectURL = revokeObjectURLSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const rows: Row[] = [
    {name: 'Alice', age: 30},
    {name: 'Bob', age: 25},
  ];
  const columns = [
    {header: 'Name', value: (r: Row) => r.name},
    {header: 'Age', value: (r: Row) => r.age},
  ];

  it('produces a non-empty .xlsx blob and returns its byte size', () => {
    const {sizeBytes} = exportRowsToExcel(rows, columns, 'people');
    expect(sizeBytes).toBeGreaterThan(0);
  });

  it('triggers a download via an anchor click', () => {
    exportRowsToExcel(rows, columns, 'people');
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalled();
  });

  it('round-trips the row/column content through a real workbook', () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(
      rows.map((r) => ({Name: columns[0].value(r), Age: columns[1].value(r)}))
    );
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const buffer = XLSX.write(workbook, {type: 'array', bookType: 'xlsx'});

    const parsed = XLSX.read(buffer, {type: 'array'});
    const sheet = parsed.Sheets[parsed.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    expect(data).toEqual([
      {Name: 'Alice', Age: 30},
      {Name: 'Bob', Age: 25},
    ]);
  });

  it('falls back to an empty string for columns without a value function', () => {
    const {sizeBytes} = exportRowsToExcel(
      rows,
      [{header: 'Name', value: (r: Row) => r.name}, {header: 'Blank'}],
      'people'
    );
    expect(sizeBytes).toBeGreaterThan(0);
  });
});
