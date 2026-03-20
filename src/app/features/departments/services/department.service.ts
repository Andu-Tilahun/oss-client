import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import { Endpoints } from '../../../core/endpoint/endpoint.model';
import { Department, DepartmentRequest } from '../models/department.model';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  constructor(private httpService: HttpService) {}

  create(request: DepartmentRequest): Observable<Department> {
    return this.httpService.post<Department>(Endpoints.DEPARTMENTS_ENDPOINT, request);
  }

  update(id: string, request: DepartmentRequest): Observable<Department> {
    return this.httpService.put<Department>(`${Endpoints.DEPARTMENTS_ENDPOINT}/${id}`, request);
  }

  get(id: string): Observable<Department> {
    return this.httpService.get<Department>(`${Endpoints.DEPARTMENTS_ENDPOINT}/${id}`);
  }

  getAll(): Observable<Department[]> {
    return this.httpService.get<Department[]>(Endpoints.DEPARTMENTS_ENDPOINT);
  }

  delete(id: string): Observable<void> {
    return this.httpService.delete<void>(`${Endpoints.DEPARTMENTS_ENDPOINT}/${id}`);
  }
}
