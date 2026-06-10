import { ColumnType } from './column-types.model';

export interface DataTableColumn<T> {
  header: string;
  columnType?: ColumnType;
  value?: (item: T) => any;
  columnAction?: (item: T) => void;
  defaultValue?: any;
  disabled?: boolean;
  /** When false, column hidden on initial load (default true if omitted). */
  defaultVisible?: boolean;
  /** Hide this column when viewport width is below this value (px). */
  hiddenBelowPx?: number;
}
