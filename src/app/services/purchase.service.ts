import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PurchaseDetail, PurchaseOrderSummary, PurchasePreview, PurchaseSummary, ProcessItemPayload } from '../models/purchase.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  private readonly endpoint = 'Purchase';

  constructor(private readonly api: ApiService) {}

  getPreview(): Observable<PurchasePreview> {
    return this.api.get<PurchasePreview>(`${this.endpoint}/preview`);
  }

  createPurchase(): Observable<{ id: string }> {
    return this.api.post<{ id: string }>(`${this.endpoint}/create`, {});
  }

  listPurchases(dateKey?: string): Observable<PurchaseSummary[]> {
    const query = dateKey ? `?dateKey=${encodeURIComponent(dateKey)}` : '';
    return this.api.get<PurchaseSummary[]>(`${this.endpoint}/list${query}`);
  }

  getPurchase(dateKey: string): Observable<PurchaseDetail> {
    return this.api.get<PurchaseDetail>(`${this.endpoint}/date/${dateKey}`);
  }

  getOrdersForPurchase(purchaseId: string): Observable<PurchaseOrderSummary[]> {
    return this.api.get<PurchaseOrderSummary[]>(`${this.endpoint}/${purchaseId}/orders`);
  }

  processPurchase(purchaseId: string, items: ProcessItemPayload[]): Observable<boolean> {
    return this.api.post<boolean>(`${this.endpoint}/${purchaseId}/process`, { items });
  }

  deletePurchase(purchaseId: string): Observable<boolean> {
    return this.api.delete<boolean>(`${this.endpoint}/${purchaseId}`);
  }
}
