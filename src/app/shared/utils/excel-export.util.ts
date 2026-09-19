import * as XLSX from 'xlsx';

export interface ExportColumn<T> {
  header: string;
  value?: (row: T) => any;
}

export function exportRowsToExcel<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filenameBase: string
): { sizeBytes: number } {
  const data = rows.map((row) => {
    const record: Record<string, any> = {};
    columns.forEach((col) => {
      record[col.header] = col.value ? (col.value(row) ?? '') : '';
    });
    return record;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  const arrayBuffer: ArrayBuffer = XLSX.write(workbook, {type: 'array', bookType: 'xlsx'});
  const blob = new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenameBase}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);

  return {sizeBytes: blob.size};
}
