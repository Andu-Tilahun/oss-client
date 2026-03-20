import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import { Endpoints } from '../../../core/endpoint/endpoint.model';
import { ConfirmReplacementRequest, ReplacementRecord } from '../models/replacement-record.model';

@Injectable({ providedIn: 'root' })
export class ReplacementRecordService {
  constructor(private httpService: HttpService) {}

  confirm(request: ConfirmReplacementRequest): Observable<ReplacementRecord> {
    return this.httpService.post<ReplacementRecord>(
      `${Endpoints.REPLACEMENT_RECORDS_ENDPOINT}/confirm`,
      request
    );
  }
}

