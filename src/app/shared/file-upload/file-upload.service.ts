import {Injectable} from '@angular/core';
import {HttpClient, HttpEvent, HttpEventType} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

export interface FileMetadata {
  id: string;
  originalFilename: string;
  storedFilename: string;
  contentType: string;
  fileSize: number;
  uploadedAt: Date;
  presignedUrl: string;
}

export interface UploadProgress {
  progress: number;
  file?: FileMetadata;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private readonly STORAGE_API_URL = `${environment.apiUrl}/files`;

  constructor(private http: HttpClient) {
  }

  uploadFile(file: File): Observable<UploadProgress> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<FileMetadata>(this.STORAGE_API_URL, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            const progress = event.total ? Math.round((100 * event.loaded) / event.total) : 0;
            return {progress};
          case HttpEventType.Response:
            return {progress: 100, file: event.body};
          default:
            return {progress: 0};
        }
      })
    );
  }

  getFileMetadata(fileId: string): Observable<FileMetadata> {
    return this.http.get<FileMetadata>(`${this.STORAGE_API_URL}/${fileId}/metadata`);
  }

  getPresignedUrl(fileId: string): Observable<string> {
    return this.getFileMetadata(fileId).pipe(
      map(metadata => metadata.presignedUrl)
    );
  }

  deleteFile(fileId: string): Observable<void> {
    return this.http.delete<void>(`${this.STORAGE_API_URL}/${fileId}`);
  }

  getFileUrl(fileId: string | undefined): string {
    return `${this.STORAGE_API_URL}/${fileId}`;
  }
}
