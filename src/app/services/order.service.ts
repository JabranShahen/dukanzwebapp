import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { Order } from '../models/order.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly endpoint = 'Order';

  constructor(private readonly api: ApiService) {}

  getOutstandingOrders(): Observable<Order[]> {
    return this.api.get<Order[] | null>(`${this.endpoint}/outstanding`).pipe(
      map((response) => (Array.isArray(response) ? response : []))
    );
  }

  updateStatus(order: Order, newStatus: string): Observable<boolean> {
    const payload = { ...order, status: newStatus };
    return this.api.put<string | boolean | object>(`${this.endpoint}`, payload).pipe(
      map(() => true),
      catchError((error) => {
        // Backend returns plain text "True" which fails JSON parsing,
        // but HTTP 200 means the update actually succeeded.
        if (error?.status === 200) {
          return of(true);
        }
        throw error;
      })
    );
  }
}
