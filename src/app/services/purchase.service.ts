import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PurchaseDetail, PurchasePreview, PurchaseSummary, ProcessItemPayload } from '../models/purchase.model';
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

  listPurchases(): Observable<PurchaseSummary[]> {
    return this.api.get<PurchaseSummary[]>(`${this.endpoint}/list`);
  }

  getPurchase(dateKey: string): Observable<PurchaseDetail> {
    return this.api.get<PurchaseDetail>(`${this.endpoint}/date/${dateKey}`);
  }

  processPurchase(purchaseId: string, items: ProcessItemPayload[]): Observable<boolean> {
    return this.api.post<boolean>(`${this.endpoint}/${purchaseId}/process`, { items });
  }
}
