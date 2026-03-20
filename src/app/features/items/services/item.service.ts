import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import { Endpoints } from '../../../core/endpoint/endpoint.model';
import { Item, ItemRequest, ItemFilterRequest } from '../models/item.model';
import { PageResponse } from '../../../shared/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ItemService {
  constructor(private httpService: HttpService) {}

  create(request: ItemRequest): Observable<Item> {
    return this.httpService.post<Item>(Endpoints.ITEMS_ENDPOINT, request);
  }

  update(id: string, request: ItemRequest): Observable<Item> {
    return this.httpService.put<Item>(`${Endpoints.ITEMS_ENDPOINT}/${id}`, request);
  }

  get(id: string): Observable<Item> {
    return this.httpService.get<Item>(`${Endpoints.ITEMS_ENDPOINT}/${id}`);
  }

  filter(request: ItemFilterRequest): Observable<PageResponse<Item>> {
    return this.httpService.post<PageResponse<Item>>(`${Endpoints.ITEMS_ENDPOINT}/filter`, request);
  }

  getReplacementQueue(): Observable<Item[]> {
    return this.httpService.get<Item[]>(`${Endpoints.ITEMS_ENDPOINT}/replacement-queue`);
  }
}
