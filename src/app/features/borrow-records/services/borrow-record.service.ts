import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import { Endpoints } from '../../../core/endpoint/endpoint.model';
import { BorrowRecord, BorrowRequest, ReturnRequest } from '../models/borrow-record.model';

@Injectable({ providedIn: 'root' })
export class BorrowRecordService {
  constructor(private httpService: HttpService) {}

  borrow(request: BorrowRequest): Observable<BorrowRecord> {
    return this.httpService.post<BorrowRecord>(
      `${Endpoints.BORROW_RECORDS_ENDPOINT}/borrow`,
      request
    );
  }

  returnItem(borrowRecordId: string, request: ReturnRequest): Observable<BorrowRecord> {
    return this.httpService.put<BorrowRecord>(
      `${Endpoints.BORROW_RECORDS_ENDPOINT}/${borrowRecordId}/return`,
      request
    );
  }

  getByEmployeeId(employeeId: string): Observable<BorrowRecord[]> {
    return this.httpService.get<BorrowRecord[]>(
      `${Endpoints.BORROW_RECORDS_ENDPOINT}/by-employee/${employeeId}`
    );
  }

  getAllActive(): Observable<BorrowRecord[]> {
    return this.httpService.get<BorrowRecord[]>(
      `${Endpoints.BORROW_RECORDS_ENDPOINT}/active`
    );
  }
}

