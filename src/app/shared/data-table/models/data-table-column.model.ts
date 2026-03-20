import { ColumnType } from './column-types.model';

export interface DataTableColumn<T> {
  header: string;
  columnType?: ColumnType;
  value?: (item: T) => any;
  columnAction?: (item: T) => void;
  defaultValue?: any;
  disabled?: boolean;
}
