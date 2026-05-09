import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { Order } from '../models/order.model';
import { DukanzUser } from '../models/user.model';
import { ApiService } from './api.service';

export interface NotificationTestResult {
  userFound: boolean;
  hasToken: boolean;
  tokenPreview: string | null;
  sendResult: string;
}

export interface BroadcastAppUpdateResult {
  notified: number;
  total: number;
}

function toIsoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

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

  getOrdersForDate(date: Date): Observable<Order[]> {
    return this.api.get<Order[] | null>(`${this.endpoint}/getListOfOrdersForDate/${toIsoDate(date)}`).pipe(
      map((response) => (Array.isArray(response) ? response : [])),
      catchError(() => of([]))
    );
  }

  getOrdersForDeliveryDate(date: Date): Observable<Order[]> {
    return this.api.get<Order[] | null>(`${this.endpoint}/getListOfOrdersForDeliveryDate/${toIsoDate(date)}`).pipe(
      map((response) => (Array.isArray(response) ? response : [])),
      catchError(() => of([]))
    );
  }

  getOrdersByIds(ids: string[]): Observable<Order[]> {
    return this.api.post<Order[] | null>(`${this.endpoint}/batch`, { ids }).pipe(
      map((response) => (Array.isArray(response) ? response : [])),
      catchError(() => of([]))
    );
  }

  testPushNotification(userId: string): Observable<NotificationTestResult> {
    return this.api.get<NotificationTestResult>(`Notification/test/${userId}`);
  }

  broadcastAppUpdate(): Observable<BroadcastAppUpdateResult> {
    return this.api.post<BroadcastAppUpdateResult>('Notification/broadcast-app-update', {});
  }

  assignDriver(order: Order, driver: DukanzUser | null): Observable<boolean> {
    const driverPayload = driver
      ? {
          id: driver.id,
          PartitionKey: driver.id,
          name: driver.name,
          address: driver.address,
          phoneNumber: driver.phoneNumber,
          isDriver: true
        }
      : null;
    const payload = { ...order, driver: driverPayload };
    return this.api.put<string | boolean | object>(this.endpoint, payload).pipe(
      map(() => true),
      catchError((error) => {
        if (error?.status === 200) return of(true);
        throw error;
      })
    );
  }

  reassignArea(orderId: string, areaId: string): Observable<boolean> {
    return this.api.patch<void>(`${this.endpoint}/${orderId}/area`, { areaId }).pipe(
      map(() => true)
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
