import { describe, it, expect, beforeEach, vi } from 'vitest';
import { convertToParamMap, ParamMap } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { FarmPlotListComponent } from './farm-plot-list.component';
import { FarmPlot } from '../../models/farm-plot.model';
import { PageResponse } from '../../../../shared/models/api-response.model';

const exportRowsToExcelMock = vi.fn(() => ({ sizeBytes: 2048 }));
vi.mock('../../../../shared/utils/excel-export.util', () => ({
  exportRowsToExcel: (...args: unknown[]) => exportRowsToExcelMock(...args),
}));

function mockPlot(overrides: Partial<FarmPlot>): FarmPlot {
  return {
    id: 'plot-1',
    title: 'North Field',
    size: 10,
    sizeType: 'ACRES',
    soilType: 'LOAMY',
    ...overrides,
  };
}

function mockPage(content: FarmPlot[]): PageResponse<FarmPlot> {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    size: content.length || 10,
    number: 0,
    first: true,
    last: true,
  };
}

function makeComponent() {
  const mockFarmPlotService = {
    filterOperationalFarmPlots: vi.fn(() => of(mockPage([mockPlot({})]))),
    filterRepairFarmPlots: vi.fn(() => of(mockPage([]))),
    filterArchivedFarmPlots: vi.fn(() => of(mockPage([]))),
    getFarmPlotById: vi.fn(),
    notifyExport: vi.fn(() => of({ success: true, message: '' })),
  };
  const mockToastService = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
  const mockRegionService = { filterRegions: vi.fn(() => of({ content: [] })) };
  const queryParams$ = new BehaviorSubject<ParamMap>(convertToParamMap({}));
  const mockRoute = {
    get snapshot() { return { queryParamMap: queryParams$.value }; },
    queryParamMap: queryParams$.asObservable(),
  };
  const setQueryParams = (params: Record<string, string>) => queryParams$.next(convertToParamMap(params));
  const component = new FarmPlotListComponent(
    mockFarmPlotService as any,
    mockToastService as any,
    mockRegionService as any,
    mockRoute as any,
  );
  return { component, mockFarmPlotService, mockToastService, setQueryParams };
}

describe('FarmPlotListComponent', () => {
  let component: FarmPlotListComponent;
  let mockFarmPlotService: ReturnType<typeof makeComponent>['mockFarmPlotService'];
  let mockToastService: ReturnType<typeof makeComponent>['mockToastService'];

  beforeEach(() => {
    ({ component, mockFarmPlotService, mockToastService } = makeComponent());
    exportRowsToExcelMock.mockClear();
  });

  it('should create', () => expect(component).toBeTruthy());

  describe('onDownload', () => {
    it('fetches the full operational set (not just the current page) and notifies the backend', () => {
      const plots = [mockPlot({ id: 'p1' }), mockPlot({ id: 'p2' })];
      component.operationalTotal = 2;
      mockFarmPlotService.filterOperationalFarmPlots.mockReturnValue(of(mockPage(plots)));

      component.onDownload();

      expect(mockFarmPlotService.filterOperationalFarmPlots).toHaveBeenCalledWith(
        expect.objectContaining({ page: 0, size: 2 })
      );
      expect(exportRowsToExcelMock).toHaveBeenCalledWith(plots, component.columns, 'farm-plots-operational');
      expect(mockFarmPlotService.notifyExport).toHaveBeenCalledWith({
        exportLabel: 'Farm Plots (Operational)',
        recordCount: 2,
        fileSizeBytes: 2048,
      });
      expect(mockToastService.success).toHaveBeenCalled();
    });

    it('requests at least 1 row even when the tab total is 0', () => {
      component.operationalTotal = 0;
      mockFarmPlotService.filterOperationalFarmPlots.mockReturnValue(of(mockPage([])));

      component.onDownload();

      expect(mockFarmPlotService.filterOperationalFarmPlots).toHaveBeenCalledWith(
        expect.objectContaining({ size: 1 })
      );
    });

    it('shows an error toast and does not export when the fetch fails', () => {
      mockFarmPlotService.filterOperationalFarmPlots.mockReturnValue({
        subscribe: ({ error }: any) => error(new Error('boom')),
      } as any);

      component.onDownload();

      expect(exportRowsToExcelMock).not.toHaveBeenCalled();
      expect(mockFarmPlotService.notifyExport).not.toHaveBeenCalled();
      expect(mockToastService.error).toHaveBeenCalled();
    });
  });
});

describe('FarmPlotListComponent deep-link (?id=)', () => {
  it('selects the deep-linked plot even when it is not on the first loaded page', () => {
    const { component, mockFarmPlotService, setQueryParams } = makeComponent();
    mockFarmPlotService.getFarmPlotById.mockReturnValue(of(mockPlot({ id: 'far-away', status: 'ACTIVE' })));
    setQueryParams({ id: 'far-away' });

    component.ngOnInit();

    expect(mockFarmPlotService.getFarmPlotById).toHaveBeenCalledWith('far-away');
    expect(component.adminActiveTab).toBe('operational');
    expect(component.selectedPlot?.id).toBe('far-away');
  });

  it('switches to the repair tab for an UNDER_MAINTENANCE plot', () => {
    const { component, mockFarmPlotService, setQueryParams } = makeComponent();
    mockFarmPlotService.getFarmPlotById.mockReturnValue(of(mockPlot({ id: 'p1', status: 'UNDER_MAINTENANCE' })));
    setQueryParams({ id: 'p1' });

    component.ngOnInit();

    expect(component.adminActiveTab).toBe('repair');
    expect(mockFarmPlotService.filterRepairFarmPlots).toHaveBeenCalled();
    expect(component.selectedPlot?.id).toBe('p1');
  });

  it('switches to the archived tab for an INACTIVE plot', () => {
    const { component, mockFarmPlotService, setQueryParams } = makeComponent();
    mockFarmPlotService.getFarmPlotById.mockReturnValue(of(mockPlot({ id: 'p2', status: 'INACTIVE' })));
    setQueryParams({ id: 'p2' });

    component.ngOnInit();

    expect(component.adminActiveTab).toBe('archived');
    expect(component.selectedPlot?.id).toBe('p2');
  });

  it('re-selects when the id changes while the page is already open', () => {
    const { component, mockFarmPlotService, setQueryParams } = makeComponent();
    mockFarmPlotService.getFarmPlotById.mockImplementation((id: string) => of(mockPlot({ id, status: 'ACTIVE' })));
    component.ngOnInit();

    setQueryParams({ id: 'a' });
    expect(component.selectedPlot?.id).toBe('a');
    setQueryParams({ id: 'b' });
    expect(component.selectedPlot?.id).toBe('b');
  });

  it('still loads the list when the by-id fetch fails', () => {
    const { component, mockFarmPlotService, setQueryParams } = makeComponent();
    mockFarmPlotService.getFarmPlotById.mockReturnValue(throwError(() => new Error('404')));
    setQueryParams({ id: 'gone' });

    component.ngOnInit();

    expect(mockFarmPlotService.filterOperationalFarmPlots).toHaveBeenCalled();
  });

  it('loads the operational tab as usual with no deep link', () => {
    const { component, mockFarmPlotService } = makeComponent();

    component.ngOnInit();

    expect(mockFarmPlotService.getFarmPlotById).not.toHaveBeenCalled();
    expect(mockFarmPlotService.filterOperationalFarmPlots).toHaveBeenCalled();
  });
});
