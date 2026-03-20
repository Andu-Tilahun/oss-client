import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import { Endpoints } from '../../../core/endpoint/endpoint.model';
import { GateLog, GateScanRequest } from '../models/gate-log.model';

@Injectable({ providedIn: 'root' })
export class GateLogService {
  constructor(private httpService: HttpService) {}

  scan(request: GateScanRequest): Observable<GateLog> {
    return this.httpService.post<GateLog>(`${Endpoints.GATE_LOGS_ENDPOINT}/scan`, request);
  }

  list(): Observable<GateLog[]> {
    return this.httpService.get<GateLog[]>(Endpoints.GATE_LOGS_ENDPOINT);
  }
}

