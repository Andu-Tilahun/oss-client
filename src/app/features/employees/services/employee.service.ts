import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import { Endpoints } from '../../../core/endpoint/endpoint.model';
import {
  Employee,
  EmployeeRequest,
  EmployeeFilterRequest,
} from '../models/employee.model';
import { PageResponse } from '../../../shared/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  constructor(private httpService: HttpService) {}

  create(request: EmployeeRequest): Observable<Employee> {
    return this.httpService.post<Employee>(Endpoints.EMPLOYEES_ENDPOINT, request);
  }

  update(id: string, request: EmployeeRequest): Observable<Employee> {
    return this.httpService.put<Employee>(`${Endpoints.EMPLOYEES_ENDPOINT}/${id}`, request);
  }

  updatePhoto(id: string, photoId: string | null): Observable<Employee> {
    return this.httpService.put<Employee>(`${Endpoints.EMPLOYEES_ENDPOINT}/${id}/photo`, { photoId });
  }

  get(id: string): Observable<Employee> {
    return this.httpService.get<Employee>(`${Endpoints.EMPLOYEES_ENDPOINT}/${id}`);
  }

  filter(request: EmployeeFilterRequest): Observable<PageResponse<Employee>> {
    return this.httpService.post<PageResponse<Employee>>(
      `${Endpoints.EMPLOYEES_ENDPOINT}/filter`,
      request
    );
  }

  getAllActive(): Observable<Employee[]> {
    return this.httpService.get<Employee[]>(`${Endpoints.EMPLOYEES_ENDPOINT}/active`);
  }
}
