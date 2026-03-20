import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import { Endpoints } from '../../../core/endpoint/endpoint.model';
import { TransferRecord, TransferRequest } from '../models/transfer-record.model';

@Injectable({ providedIn: 'root' })
export class TransferRecordService {
  constructor(private httpService: HttpService) {}

  transfer(request: TransferRequest): Observable<TransferRecord> {
    return this.httpService.post<TransferRecord>(
      `${Endpoints.TRANSFER_RECORDS_ENDPOINT}/transfer`,
      request
    );
  }
}

