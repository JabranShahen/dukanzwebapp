import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ResetPurchaseResult } from '../models/data-updates.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class DataUpdatesService {
  private readonly endpoint = 'DataUpdates';

  constructor(private readonly api: ApiService) {}

  resetPurchase(): Observable<ResetPurchaseResult> {
    return this.api.post<ResetPurchaseResult>(`${this.endpoint}/reset-purchase`, {});
  }
}
