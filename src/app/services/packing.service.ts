import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

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
  private readonly requestTimeoutMs = 25000;

  constructor(private readonly api: ApiService) {}

  listBatches(): Observable<PackingBatchSummary[]> {
    return this.withTimeout(this.api.get<PackingBatchSummary[]>(`${this.endpoint}/list`));
  }

  getBatch(purchaseDateKey: string): Observable<PackingBatchDetail> {
    return this.withTimeout(this.api.get<PackingBatchDetail>(`${this.endpoint}/${purchaseDateKey}`));
  }

  markPacked(purchaseDateKey: string, orderIds: string[]): Observable<MarkPackedResult> {
    return this.withTimeout(this.api.post<MarkPackedResult>(`${this.endpoint}/${purchaseDateKey}/mark-packed`, { orderIds }));
  }

  private withTimeout<T>(request: Observable<T>): Observable<T> {
    return request.pipe(timeout(this.requestTimeoutMs));
  }
}
