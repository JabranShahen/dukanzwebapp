import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ConfigContext, DukanzConfig, DukanzConfigMutation } from '../models/dukanz-config.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class DukanzConfigService {
  private readonly endpoint = 'DukanzConfig';

  constructor(private readonly api: ApiService) {}

  getConfig(areaId?: string | null): Observable<DukanzConfig | null> {
    const url = areaId ? `${this.endpoint}?areaId=${encodeURIComponent(areaId)}` : this.endpoint;
    return this.api.get<DukanzConfig[] | null>(url).pipe(
      map((response) => {
        if (!Array.isArray(response) || response.length === 0) {
          return null;
        }
        return this.normalizeConfig(response[0]);
      })
    );
  }

  getConfigContext(areaId: string | null): Observable<ConfigContext> {
    const url = areaId
      ? `${this.endpoint}/context?areaId=${encodeURIComponent(areaId)}`
      : `${this.endpoint}/context`;
    return this.api.get<{
      effectiveConfig: DukanzConfig | null;
      areaConfig:      DukanzConfig | null;
      globalConfig:    DukanzConfig | null;
    }>(url).pipe(
      map((res) => ({
        effectiveConfig: res.effectiveConfig ? this.normalizeConfig(res.effectiveConfig) : null,
        areaConfig:      res.areaConfig      ? this.normalizeConfig(res.areaConfig)      : null,
        globalConfig:    res.globalConfig    ? this.normalizeConfig(res.globalConfig)    : null,
      }))
    );
  }

  save(payload: DukanzConfigMutation, areaId?: string | null): Observable<DukanzConfig> {
    const requestPayload = this.toMutationPayload(payload);
    const url = areaId ? `${this.endpoint}?areaId=${encodeURIComponent(areaId)}` : this.endpoint;

    // Always PUT — the backend resolves the authoritative id from the DB and
    // falls back to insert when no config exists yet.
    return this.api
      .put<{ updated?: boolean; entity?: DukanzConfig } | DukanzConfig>(url, requestPayload)
      .pipe(
        map((response) => {
          const entity = (response as { entity?: DukanzConfig })?.entity;
          if (entity) {
            return this.normalizeConfig(entity);
          }
          return this.normalizeConfig({ ...payload, id: payload.id ?? '' });
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
      contactPhoneNumber: (payload.contactPhoneNumber || '').trim(),
      deliveryOffsetDays: this.normalizeInt(payload.deliveryOffsetDays) ?? 1,
      latestAppVersion: (payload.latestAppVersion || '').trim(),
      minimumSupportedAppVersion: (payload.minimumSupportedAppVersion || '').trim(),
      appUpgradePlayStoreUrl: (payload.appUpgradePlayStoreUrl || '').trim(),
      forceAppUpgrade: !!payload.forceAppUpgrade,
      claimsEnabled: !!payload.claimsEnabled,
      claimsPilotAreaIds: Array.isArray(payload.claimsPilotAreaIds)
        ? payload.claimsPilotAreaIds.map((areaId) => String(areaId || '').trim()).filter(Boolean)
        : [],
      claimWindowDays: this.normalizePositiveInt(payload.claimWindowDays, 7),
      claimsRequirePhotos: !!payload.claimsRequirePhotos,
      claimsMaxPhotos: this.normalizePositiveInt(payload.claimsMaxPhotos, 5),
      claimsMaxPhotoSizeMb: this.normalizePositiveInt(payload.claimsMaxPhotoSizeMb, 5),
      claimsStorageContainer: (payload.claimsStorageContainer || 'claims').trim() || 'claims',
      claimsAttachmentRetentionDays: this.normalizePositiveInt(payload.claimsAttachmentRetentionDays, 90),
      claimsDocumentRetentionDays: this.normalizePositiveInt(payload.claimsDocumentRetentionDays, 365),
      areaId: payload.areaId ?? null
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
      contactPhoneNumber: (raw.contactPhoneNumber || '').trim(),
      deliveryOffsetDays: this.normalizeInt(raw.deliveryOffsetDays) ?? 1,
      latestAppVersion: (raw.latestAppVersion || '').trim(),
      minimumSupportedAppVersion: (raw.minimumSupportedAppVersion || '').trim(),
      appUpgradePlayStoreUrl: (raw.appUpgradePlayStoreUrl || '').trim(),
      forceAppUpgrade: !!raw.forceAppUpgrade,
      claimsEnabled: !!raw.claimsEnabled,
      claimsPilotAreaIds: Array.isArray(raw.claimsPilotAreaIds)
        ? raw.claimsPilotAreaIds.map((areaId) => String(areaId || '').trim()).filter(Boolean)
        : [],
      claimWindowDays: this.normalizePositiveInt(raw.claimWindowDays, 7),
      claimsRequirePhotos: !!raw.claimsRequirePhotos,
      claimsMaxPhotos: this.normalizePositiveInt(raw.claimsMaxPhotos, 5),
      claimsMaxPhotoSizeMb: this.normalizePositiveInt(raw.claimsMaxPhotoSizeMb, 5),
      claimsStorageContainer: (raw.claimsStorageContainer || 'claims').trim() || 'claims',
      claimsAttachmentRetentionDays: this.normalizePositiveInt(raw.claimsAttachmentRetentionDays, 90),
      claimsDocumentRetentionDays: this.normalizePositiveInt(raw.claimsDocumentRetentionDays, 365),
      areaId: raw.areaId ?? null
    };
  }

  private normalizeNumber(value: number | undefined): number {
    return Number.isFinite(value) ? Number(value) : 0;
  }

  private normalizeInt(value: number | undefined): number {
    const n = Number.isFinite(value) ? Math.round(Number(value)) : 0;
    return n < 0 ? 0 : n;
  }

  private normalizePositiveInt(value: number | undefined, fallback: number): number {
    const n = this.normalizeInt(value);
    return n > 0 ? n : fallback;
  }
}
