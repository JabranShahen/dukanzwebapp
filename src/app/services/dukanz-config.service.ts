import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { DukanzConfig, DukanzConfigMutation } from '../models/dukanz-config.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class DukanzConfigService {
  private readonly endpoint = 'DukanzConfig';

  constructor(private readonly api: ApiService) {}

  getConfig(): Observable<DukanzConfig | null> {
    return this.api.get<DukanzConfig[] | null>(this.endpoint).pipe(
      map((response) => {
        if (!Array.isArray(response) || response.length === 0) {
          return null;
        }
        return this.normalizeConfig(response[0]);
      })
    );
  }

  save(payload: DukanzConfigMutation): Observable<DukanzConfig> {
    const requestPayload = this.toMutationPayload(payload);

    if (payload.id) {
      return this.api
        .put<{ updated?: boolean; entity?: DukanzConfig } | DukanzConfig>(this.endpoint, requestPayload)
        .pipe(
          map((response) => {
            const entity = (response as { entity?: DukanzConfig })?.entity;
            if (entity) {
              return this.normalizeConfig(entity);
            }
            return this.normalizeConfig({ ...payload, id: payload.id! });
          })
        );
    }

    return this.api
      .post<{ id?: string; entity?: DukanzConfig } | DukanzConfig>(this.endpoint, requestPayload)
      .pipe(
        map((response) => {
          const entity = (response as { entity?: DukanzConfig })?.entity;
          if (entity) {
            return this.normalizeConfig(entity);
          }
          const id = (response as { id?: string })?.id || '';
          return this.normalizeConfig({ ...payload, id });
        })
      );
  }

  private toMutationPayload(payload: DukanzConfigMutation): Record<string, unknown> {
    const result: Record<string, unknown> = {
      message: (payload.message || '').trim(),
      deliveryCharges: this.normalizeNumber(payload.deliveryCharges),
      minOrderSize: this.normalizeNumber(payload.minOrderSize),
      maxOrderSize: this.normalizeNumber(payload.maxOrderSize),
      freeDeliveryOrderSize: this.normalizeNumber(payload.freeDeliveryOrderSize),
      cutoffTime: (payload.cutoffTime || '').trim(),
      maxNumberOfActiveOrders: this.normalizeInt(payload.maxNumberOfActiveOrders),
      minOrderActiveScreenPresenseHours: this.normalizeInt(payload.minOrderActiveScreenPresenseHours),
      maxNumberOfHistoryOrders: this.normalizeInt(payload.maxNumberOfHistoryOrders),
      contactPhoneNumber: (payload.contactPhoneNumber || '').trim()
    };

    if (payload.id) {
      result['id'] = payload.id;
      result['partitionKey'] = payload.id;
      result['PartitionKey'] = payload.id;
    }

    return result;
  }

  private normalizeConfig(raw: Partial<DukanzConfig>): DukanzConfig {
    const id = (raw.id || '').trim();
    const partitionKey = (raw.PartitionKey || raw.partitionKey || id || '').trim();

    return {
      id,
      PartitionKey: partitionKey || undefined,
      partitionKey: partitionKey || undefined,
      message: (raw.message || '').trim(),
      deliveryCharges: this.normalizeNumber(raw.deliveryCharges),
      minOrderSize: this.normalizeNumber(raw.minOrderSize),
      maxOrderSize: this.normalizeNumber(raw.maxOrderSize),
      freeDeliveryOrderSize: this.normalizeNumber(raw.freeDeliveryOrderSize),
      cutoffTime: (raw.cutoffTime || '').trim(),
      maxNumberOfActiveOrders: this.normalizeInt(raw.maxNumberOfActiveOrders),
      minOrderActiveScreenPresenseHours: this.normalizeInt(raw.minOrderActiveScreenPresenseHours),
      maxNumberOfHistoryOrders: this.normalizeInt(raw.maxNumberOfHistoryOrders),
      contactPhoneNumber: (raw.contactPhoneNumber || '').trim()
    };
  }

  private normalizeNumber(value: number | undefined): number {
    return Number.isFinite(value) ? Number(value) : 0;
  }

  private normalizeInt(value: number | undefined): number {
    const n = Number.isFinite(value) ? Math.round(Number(value)) : 0;
    return n < 0 ? 0 : n;
  }
}
