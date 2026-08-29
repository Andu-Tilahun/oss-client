import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { GalleryMediaPickerComponent } from './gallery-media-picker.component';
import { FileMetadata } from '../../../../shared/file-upload/file-upload.service';

const IMAGE_FILE_META: FileMetadata = {
  id: 'file-1',
  originalFilename: 'photo.jpg',
  storedFilename: 'stored-photo.jpg',
  contentType: 'image/jpeg',
  fileSize: 1024,
  uploadedAt: new Date(),
  presignedUrl: 'http://storage/file-1',
};

const VIDEO_FILE_META: FileMetadata = {
  id: 'file-2',
  originalFilename: 'clip.mp4',
  storedFilename: 'stored-clip.mp4',
  contentType: 'video/mp4',
  fileSize: 2048,
  uploadedAt: new Date(),
  presignedUrl: 'http://storage/file-2',
};

const DOC_FILE_META: FileMetadata = {
  id: 'file-3',
  originalFilename: 'doc.pdf',
  storedFilename: 'stored-doc.pdf',
  contentType: 'application/pdf',
  fileSize: 512,
  uploadedAt: new Date(),
  presignedUrl: 'http://storage/file-3',
};

const FARM_PLOT_IMAGE_REFS = [
  { imageUuid: 'file-1', farmPlotId: 'plot-1', farmPlotTitle: 'North Field' },
  { imageUuid: 'file-2', farmPlotId: 'plot-2', farmPlotTitle: 'South Field' },
];

function makeComponent() {
  const mockFileUploadService = {
    uploadFile: vi.fn(() => of({ progress: 100, file: IMAGE_FILE_META })),
    getFilesByIds: vi.fn(() => of([IMAGE_FILE_META, VIDEO_FILE_META, DOC_FILE_META])),
    getFileMetadata: vi.fn(() => of(IMAGE_FILE_META)),
  };
  const mockFarmPlotService = {
    getAllFarmPlotImages: vi.fn(() => of(FARM_PLOT_IMAGE_REFS)),
  };
  const mockToastService = { error: vi.fn(), success: vi.fn() };
  const component = new GalleryMediaPickerComponent(
    mockFileUploadService as any, mockFarmPlotService as any, mockToastService as any,
  );
  return { component, mockFileUploadService, mockFarmPlotService, mockToastService };
}

function fileSelectEvent(file: File): Event {
  return { target: { files: [file], value: '' } } as unknown as Event;
}

describe('GalleryMediaPickerComponent', () => {
  let component: GalleryMediaPickerComponent;
  let mockFileUploadService: ReturnType<typeof makeComponent>['mockFileUploadService'];
  let mockFarmPlotService: ReturnType<typeof makeComponent>['mockFarmPlotService'];
  let mockToastService: ReturnType<typeof makeComponent>['mockToastService'];

  beforeEach(() => {
    ({ component, mockFileUploadService, mockFarmPlotService, mockToastService } = makeComponent());
  });

  it('should create', () => expect(component).toBeTruthy());

  it('uploads a valid image and emits the selection with inferred kind', () => {
    const emitted: any[] = [];
    component.mediaSelected.subscribe((v) => emitted.push(v));

    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    component.onFileSelected(fileSelectEvent(file));

    expect(mockFileUploadService.uploadFile).toHaveBeenCalledWith(file);
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toEqual({ id: 'file-1', kind: 'IMAGE', previewUrl: 'http://storage/file-1' });
  });

  it('rejects a non-image/video file without calling upload', () => {
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    component.onFileSelected(fileSelectEvent(file));

    expect(mockFileUploadService.uploadFile).not.toHaveBeenCalled();
    expect(mockToastService.error).toHaveBeenCalled();
  });

  it('rejects an oversized image without calling upload', () => {
    const bigFile = new File([new Uint8Array(11 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
    component.onFileSelected(fileSelectEvent(bigFile));

    expect(mockFileUploadService.uploadFile).not.toHaveBeenCalled();
    expect(mockToastService.error).toHaveBeenCalled();
  });

  it('loadExisting fetches farm plot image refs then resolves them via batch lookup', () => {
    component.loadExisting();

    expect(mockFarmPlotService.getAllFarmPlotImages).toHaveBeenCalled();
    expect(mockFileUploadService.getFilesByIds).toHaveBeenCalledWith(['file-1', 'file-2']);
  });

  it('loadExisting de-duplicates repeated farm plot image UUIDs', () => {
    mockFarmPlotService.getAllFarmPlotImages.mockReturnValue(of([
      { imageUuid: 'file-1', farmPlotId: 'plot-1', farmPlotTitle: 'North Field' },
      { imageUuid: 'file-1', farmPlotId: 'plot-1', farmPlotTitle: 'North Field' },
    ]));

    component.loadExisting();

    expect(mockFileUploadService.getFilesByIds).toHaveBeenCalledWith(['file-1']);
  });

  it('loadExisting filters results to image/video content types only', () => {
    component.loadExisting();
    expect(component.existingFiles).toHaveLength(2);
    expect(component.existingFiles.map((f) => f.id)).toEqual(['file-1', 'file-2']);
  });

  it('selectExisting emits the chosen file id and kind', () => {
    const emitted: any[] = [];
    component.mediaSelected.subscribe((v) => emitted.push(v));

    component.selectExisting(VIDEO_FILE_META);

    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toEqual({ id: 'file-2', kind: 'VIDEO', previewUrl: 'http://storage/file-2' });
  });

  it('switchToExisting triggers loadExisting on first open', () => {
    component.switchToExisting();
    expect(mockFarmPlotService.getAllFarmPlotImages).toHaveBeenCalled();
    expect(component.mode).toBe('existing');
  });

  it('ngOnChanges resolves a preview for an existing mediaUuid input', () => {
    component.currentMediaUuid = 'media-uuid-1';
    component.currentKind = 'IMAGE';
    component.ngOnChanges({ currentMediaUuid: { currentValue: 'media-uuid-1' } } as any);

    expect(mockFileUploadService.getFileMetadata).toHaveBeenCalledWith('media-uuid-1');
    expect(component.currentPreviewUrl).toBe('http://storage/file-1');
  });
});
