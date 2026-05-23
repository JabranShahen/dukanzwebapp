import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ResetPackingResult, ResetPurchaseResult } from '../models/data-updates.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class DataUpdatesService {
  private readonly endpoint = 'DataUpdates';

  constructor(private readonly api: ApiService) {}

  resetPurchase(orderIds?: string[]): Observable<ResetPurchaseResult> {
    const body = orderIds && orderIds.length > 0 ? { orderIds } : {};
    return this.api.post<ResetPurchaseResult>(`${this.endpoint}/reset-purchase`, body);
  }

  resetPacking(orderIds?: string[]): Observable<ResetPackingResult> {
    const body = orderIds && orderIds.length > 0 ? { orderIds } : {};
    return this.api.post<ResetPackingResult>(`${this.endpoint}/reset-packing`, body);
  }
}
