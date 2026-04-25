import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {FarmPlotSizeType, FarmPlotSoilType, FarmPlotStatus} from '../../models/farm-plot.model';
import {FilterBarComponent} from '../../../../shared/components/filter-bar/filter-bar.component';

@Component({
  selector: 'app-farm-plot-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterBarComponent],
  templateUrl: './farm-plot-filter.component.html',
  styleUrls: ['./farm-plot-filter.component.css'],
})
export class FarmPlotFilterComponent {
  @Input() showSearch = true;
  @Input() showStatus = true;

  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();

  @Input() status: FarmPlotStatus | '' = '';
  @Output() statusChange = new EventEmitter<FarmPlotStatus | ''>();

  @Input() soilType: FarmPlotSoilType | '' = '';
  @Output() soilTypeChange = new EventEmitter<FarmPlotSoilType | ''>();

  @Input() sizeType: FarmPlotSizeType | '' = '';
  @Output() sizeTypeChange = new EventEmitter<FarmPlotSizeType | ''>();

  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() filterChange = new EventEmitter<void>();

  readonly statuses: Array<FarmPlotStatus | ''> = ['ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE'];
  readonly soilTypes: Array<FarmPlotSoilType | ''> = ['SANDY', 'CLAY', 'LOAMY'];
  readonly sizeTypes: Array<FarmPlotSizeType | ''> = ['ACRES', 'HECTARES'];

  onSearchTextChange(value: string) {
    this.searchTextChange.emit(value);
  }

  onSearch() {
    this.searchChange.emit();
  }

  onStatusChange(value: FarmPlotStatus | '') {
    this.statusChange.emit(value);
    this.filterChange.emit();
  }

  onSoilTypeChange(value: FarmPlotSoilType | '') {
    this.soilTypeChange.emit(value);
    this.filterChange.emit();
  }

  onSizeTypeChange(value: FarmPlotSizeType | '') {
    this.sizeTypeChange.emit(value);
    this.filterChange.emit();
  }

  onClearFilters() {
    this.searchTextChange.emit('');
    this.statusChange.emit('');
    this.soilTypeChange.emit('');
    this.sizeTypeChange.emit('');
    this.clearFilters.emit();
  }
}

