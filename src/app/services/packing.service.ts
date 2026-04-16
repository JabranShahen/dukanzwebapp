import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  MarkPackedResult,
  PackingBatchDetail,
  PackingBatchSummary
} from '../models/packing.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class PackingService {
  private readonly endpoint = 'Packing';

  constructor(private readonly api: ApiService) {}

  listBatches(): Observable<PackingBatchSummary[]> {
    return this.api.get<PackingBatchSummary[]>(`${this.endpoint}/list`);
  }

  getBatch(purchaseDateKey: string): Observable<PackingBatchDetail> {
    return this.api.get<PackingBatchDetail>(`${this.endpoint}/${purchaseDateKey}`);
  }

  markPacked(purchaseDateKey: string, orderIds: string[]): Observable<MarkPackedResult> {
    return this.api.post<MarkPackedResult>(`${this.endpoint}/${purchaseDateKey}/mark-packed`, { orderIds });
  }
}
