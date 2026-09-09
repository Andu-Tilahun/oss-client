import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
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
    notifyExport: vi.fn(() => of({ success: true, message: '' })),
  };
  const mockToastService = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
  const mockRegionService = { filterRegions: vi.fn() };
  const component = new FarmPlotListComponent(
    mockFarmPlotService as any,
    mockToastService as any,
    mockRegionService as any
  );
  return { component, mockFarmPlotService, mockToastService };
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
