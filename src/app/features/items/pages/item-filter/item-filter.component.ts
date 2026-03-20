import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemCondition, ItemStatus } from '../../models/item.model';
import { ItemType } from '../../../item-types/models/item-type.model';
import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar.component';

@Component({
  selector: 'app-item-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterBarComponent],
  templateUrl: './item-filter.component.html',
})
export class ItemFilterComponent {
  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();

  @Input() itemTypes: ItemType[] = [];
  @Input() selectedItemTypeId = '';
  @Output() selectedItemTypeIdChange = new EventEmitter<string>();

  @Input() selectedStatuses: ItemStatus[] = [];
  @Output() selectedStatusesChange = new EventEmitter<ItemStatus[]>();

  @Input() selectedConditions: ItemCondition[] = [];
  @Output() selectedConditionsChange = new EventEmitter<ItemCondition[]>();

  @Output() filterChange = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  itemTypeDropdownOpen = false;
  statusDropdownOpen = false;
  conditionDropdownOpen = false;

  readonly statuses: ItemStatus[] = ['New', 'Available', 'Borrowed', 'Replacement', 'Damaged', 'Retired'];
  readonly conditions: ItemCondition[] = ['New', 'Good', 'Fair', 'Damaged'];

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.itemTypeDropdownOpen = false;
      this.statusDropdownOpen = false;
      this.conditionDropdownOpen = false;
    }
  }

  onSearchTextInput(value: string): void {
    this.searchTextChange.emit(value);
  }

  onSearch(): void {
    this.searchChange.emit();
  }

  toggleItemTypeDropdown(e: Event): void {
    e.stopPropagation();
    this.itemTypeDropdownOpen = !this.itemTypeDropdownOpen;
    this.statusDropdownOpen = false;
    this.conditionDropdownOpen = false;
  }

  toggleStatusDropdown(e: Event): void {
    e.stopPropagation();
    this.statusDropdownOpen = !this.statusDropdownOpen;
    this.itemTypeDropdownOpen = false;
    this.conditionDropdownOpen = false;
  }

  toggleConditionDropdown(e: Event): void {
    e.stopPropagation();
    this.conditionDropdownOpen = !this.conditionDropdownOpen;
    this.itemTypeDropdownOpen = false;
    this.statusDropdownOpen = false;
  }

  selectItemType(id: string): void {
    this.selectedItemTypeIdChange.emit(id);
    this.filterChange.emit();
    this.itemTypeDropdownOpen = false;
  }

  isStatusSelected(s: ItemStatus): boolean {
    return (this.selectedStatuses ?? []).includes(s);
  }

  toggleStatus(s: ItemStatus): void {
    const current = new Set(this.selectedStatuses ?? []);
    if (current.has(s)) current.delete(s);
    else current.add(s);
    this.selectedStatusesChange.emit(Array.from(current));
    this.filterChange.emit();
  }

  isConditionSelected(c: ItemCondition): boolean {
    return (this.selectedConditions ?? []).includes(c);
  }

  toggleCondition(c: ItemCondition): void {
    const current = new Set(this.selectedConditions ?? []);
    if (current.has(c)) current.delete(c);
    else current.add(c);
    this.selectedConditionsChange.emit(Array.from(current));
    this.filterChange.emit();
  }

  onClearFilters(): void {
    this.searchTextChange.emit('');
    this.selectedItemTypeIdChange.emit('');
    this.selectedStatusesChange.emit([]);
    this.selectedConditionsChange.emit([]);
    this.clearFilters.emit();
  }

  getSelectedItemTypeLabel(): string {
    if (!this.selectedItemTypeId) return 'All';
    const t = this.itemTypes.find((x) => x.id === this.selectedItemTypeId);
    return t?.name ?? 'All';
  }

  getSelectedStatusesLabel(): string {
    const s = this.selectedStatuses ?? [];
    if (!s.length) return 'All';
    return s.length <= 2 ? s.join(', ') : `${s.length} selected`;
  }

  getSelectedConditionsLabel(): string {
    const c = this.selectedConditions ?? [];
    if (!c.length) return 'All';
    return c.length <= 2 ? c.join(', ') : `${c.length} selected`;
  }
}
