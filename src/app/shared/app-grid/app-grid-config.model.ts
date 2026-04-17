import { DataTableColumn } from './data-table-column.model';

/**
 * Configuration for the App Grid (parent-child relationship table).
 */
export interface AppGridConfig<TParent, TChild> {
  /** Columns for the parent (top-level) rows */
  parentColumns: DataTableColumn<TParent>[];

  /** Columns for the child rows displayed on expansion */
  childColumns: DataTableColumn<TChild>[];

  /**
   * Function that returns the children for a given parent row.
   * Can return an array or a Promise/Observable-resolved array.
   */
  getChildren: (parent: TParent) => TChild[];

  /** Optional: label shown above child grid */
  childSectionLabel?: (parent: TParent) => string;

  /** Unique key accessor for tracking parent rows */
  parentTrackBy: (parent: TParent) => any;

  /** Unique key accessor for tracking child rows */
  childTrackBy: (child: TChild) => any;
}
