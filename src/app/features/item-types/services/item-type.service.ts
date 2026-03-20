import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import { Endpoints } from '../../../core/endpoint/endpoint.model';
import { ItemType, ItemTypeRequest } from '../models/item-type.model';

@Injectable({ providedIn: 'root' })
export class ItemTypeService {
  constructor(private httpService: HttpService) {}

  create(request: ItemTypeRequest): Observable<ItemType> {
    return this.httpService.post<ItemType>(Endpoints.ITEM_TYPES_ENDPOINT, request);
  }

  update(id: string, request: ItemTypeRequest): Observable<ItemType> {
    return this.httpService.put<ItemType>(`${Endpoints.ITEM_TYPES_ENDPOINT}/${id}`, request);
  }

  get(id: string): Observable<ItemType> {
    return this.httpService.get<ItemType>(`${Endpoints.ITEM_TYPES_ENDPOINT}/${id}`);
  }

  getAll(): Observable<ItemType[]> {
    return this.httpService.get<ItemType[]>(Endpoints.ITEM_TYPES_ENDPOINT);
  }

  delete(id: string): Observable<void> {
    return this.httpService.delete<void>(`${Endpoints.ITEM_TYPES_ENDPOINT}/${id}`);
  }
}
