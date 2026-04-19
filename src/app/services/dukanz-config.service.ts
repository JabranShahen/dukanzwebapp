import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { ApiService } from './api-service';
import { createIdleState, ResourceState } from './resource-state';
import { CreateDukanzConfigRequest, DukanzConfig, UpdateDukanzConfigRequest } from '../entities/dukanz-config';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DukanzConfigService {
  private readonly stateSubject = new BehaviorSubject<ResourceState<DukanzConfig | null>>(createIdleState(null));
  readonly state$ = this.stateSubject.asObservable();

  constructor(private readonly api: ApiService) {}

  load(force = false): void {
    const current = this.stateSubject.value;
    if (!force && current.status === 'loading') {
      return;
    }

    this.stateSubject.next({
      status: 'loading',
      data: current.data,
      lastLoadedAt: current.lastLoadedAt,
    });

    this.api.get<DukanzConfig | DukanzConfig[] | null>(environment.api.endpoints.dukanzConfig).subscribe({
      next: (payload) => {
        const config = this.normalizeConfig(payload);
        this.stateSubject.next({
          status: config ? 'ready' : 'empty',
          data: config,
          lastLoadedAt: new Date().toISOString(),
        });
      },
      error: () => {
        this.stateSubject.next({
          status: 'error',
          data: null,
          error: 'DukanzConfig could not be loaded from the API.',
          lastLoadedAt: new Date().toISOString(),
        });
      },
    });
  }

  initialize(request: CreateDukanzConfigRequest): Observable<unknown> {
    return this.api.post<unknown>(environment.api.endpoints.dukanzConfig, this.toCreatePayload(request));
  }

  update(request: UpdateDukanzConfigRequest): Observable<unknown> {
    return this.api.put<unknown>(environment.api.endpoints.dukanzConfig, this.toUpdatePayload(request));
  }

  getSnapshot(): ResourceState<DukanzConfig | null> {
    return this.stateSubject.value;
  }

  private normalizeConfig(payload: DukanzConfig | DukanzConfig[] | null): DukanzConfig | null {
    if (!payload) {
      return null;
    }

    if (Array.isArray(payload)) {
      return payload.length > 0 ? this.hydrateConfig(payload[0]) : null;
    }

    return this.hydrateConfig(payload);
  }

  private toCreatePayload(request: CreateDukanzConfigRequest): DukanzConfig {
    const id = request.id ?? this.newGuid();
    return {
      id,
      PartitionKey: id,
      partitionKey: id,
      ...this.normalizeConfigFields(request),
    };
  }

  private toUpdatePayload(request: UpdateDukanzConfigRequest): DukanzConfig {
    const id = request.id;
    return {
      id,
      PartitionKey: id,
      partitionKey: id,
      ...this.normalizeConfigFields(request),
    };
  }

  private normalizeConfigFields(
    request: Omit<CreateDukanzConfigRequest, 'id'> | Omit<UpdateDukanzConfigRequest, 'id'>,
  ): Omit<DukanzConfig, 'id' | 'PartitionKey' | 'partitionKey'> {
    return {
      message: request.message.trim(),
      deliveryCharges: Number(request.deliveryCharges),
      minOrderSize: Number(request.minOrderSize),
      maxOrderSize: Number(request.maxOrderSize),
      freeDeliveryOrderSize: Number(request.freeDeliveryOrderSize),
      cutoffTime: request.cutoffTime.trim(),
      maxNumberOfActiveOrders: Number(request.maxNumberOfActiveOrders),
      minOrderActiveScreenPresenseHours: Number(request.minOrderActiveScreenPresenseHours),
      maxNumberOfHistoryOrders: Number(request.maxNumberOfHistoryOrders),
      contactPhoneNumber: request.contactPhoneNumber.trim(),
      latestAppVersion: request.latestAppVersion.trim(),
      minimumSupportedAppVersion: request.minimumSupportedAppVersion.trim(),
      appUpgradePlayStoreUrl: request.appUpgradePlayStoreUrl.trim(),
      forceAppUpgrade: Boolean(request.forceAppUpgrade),
    };
  }

  private hydrateConfig(config: Partial<DukanzConfig>): DukanzConfig {
    const id = config.id ?? this.newGuid();
    return {
      id,
      PartitionKey: config.PartitionKey ?? config.partitionKey ?? id,
      partitionKey: config.partitionKey ?? config.PartitionKey ?? id,
      message: config.message ?? '',
      deliveryCharges: Number(config.deliveryCharges ?? 0),
      minOrderSize: Number(config.minOrderSize ?? 0),
      maxOrderSize: Number(config.maxOrderSize ?? 0),
      freeDeliveryOrderSize: Number(config.freeDeliveryOrderSize ?? 0),
      cutoffTime: config.cutoffTime ?? '',
      maxNumberOfActiveOrders: Number(config.maxNumberOfActiveOrders ?? 0),
      minOrderActiveScreenPresenseHours: Number(config.minOrderActiveScreenPresenseHours ?? 0),
      maxNumberOfHistoryOrders: Number(config.maxNumberOfHistoryOrders ?? 0),
      contactPhoneNumber: config.contactPhoneNumber ?? '',
      latestAppVersion: config.latestAppVersion ?? '',
      minimumSupportedAppVersion: config.minimumSupportedAppVersion ?? '',
      appUpgradePlayStoreUrl: config.appUpgradePlayStoreUrl ?? '',
      forceAppUpgrade: config.forceAppUpgrade ?? false,
    };
  }

  private newGuid(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = Math.trunc(Math.random() * 16);
      const value = char === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }
}
