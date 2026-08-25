import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { BatchScheduleWindow } from '../models/batch-schedule.model';
import { ApiService } from '../services/api.service';

export type BatchMonitoringStatus =
  | 'approved'
  | 'processing'
  | 'packed'
  | 'dispatched'
  | 'delivered'
  | 'cancelled';

export const BATCH_MONITORING_STATUSES: BatchMonitoringStatus[] = [
  'approved',
  'processing',
  'packed',
  'dispatched',
  'delivered',
  'cancelled'
];

export const BATCH_MONITORING_STATUS_COLUMNS: Array<{ key: BatchMonitoringStatus; label: string }> = [
  { key: 'approved', label: 'Approved' },
  { key: 'processing', label: 'Processing' },
  { key: 'packed', label: 'Packed' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' }
];

export interface BatchRecord {
  id?: string | null;
  Id?: string | null;
  areaId?: string | null;
  AreaId?: string | null;
  datePkt?: string | null;
  DatePkt?: string | null;
  batchIndex?: number | null;
  BatchIndex?: number | null;
  label?: string | null;
  Label?: string | null;
  startTimePkt?: string | null;
  StartTimePkt?: string | null;
  endTimePkt?: string | null;
  EndTimePkt?: string | null;
}

export interface OrderBatchProjection {
  id?: string | null;
  areaId?: string | null;
  AreaId?: string | null;
  status?: string | null;
  Status?: string | null;
  batchId?: string | null;
  BatchId?: string | null;
  createdAtPk?: string | null;
  CreatedAtPk?: string | null;
  expectedDeliveryFromPkt?: string | null;
  ExpectedDeliveryFromPkt?: string | null;
  expectedDeliveryToPkt?: string | null;
  ExpectedDeliveryToPkt?: string | null;
}

export interface BatchSlotRow {
  batchIndex: number | null;
  batchId: string | null;
  label: string;
  windowTimes: string;
  counts: Record<BatchMonitoringStatus, number>;
  total: number;
  enabled: boolean;
  isUnbatched: boolean;
  hasActualRecord: boolean;
}

export interface BatchMonitoringResult {
  schedule: BatchScheduleWindow[];
  records: BatchRecord[];
  orders: OrderBatchProjection[];
  rows: BatchSlotRow[];
}

interface NormalizedBatchRecord {
  id: string;
  batchIndex: number;
  label: string;
  startTimePkt: string;
  endTimePkt: string;
}

@Injectable({ providedIn: 'root' })
export class BatchMonitoringService {
  constructor(private readonly api: ApiService) {}

  getSchedule(areaId: string): Observable<BatchScheduleWindow[]> {
    return this.api.get<BatchScheduleWindow[] | null>(`batch/schedule/${encodeURIComponent(areaId)}`).pipe(
      map((response) => (Array.isArray(response) ? response : []))
    );
  }

  getBatchRecords(areaId: string, date: string): Observable<BatchRecord[]> {
    return this.api
      .get<BatchRecord[] | null>(
        `batch/records/${encodeURIComponent(areaId)}?date=${encodeURIComponent(date)}`
      )
      .pipe(
        map((response) => (Array.isArray(response) ? response : [])),
        catchError(() => of([]))
      );
  }

  getOrdersByAreaDate(areaId: string, date: string): Observable<OrderBatchProjection[]> {
    // Backend: GET /api/order/by-area-date?areaId=&date=yyyy-MM-dd[&page=1&pageSize=100]
    // Returns paginated wrapper { items, totalCount, page, pageSize }.
    // Monitoring fetches all orders for the day (default pageSize=100 covers typical day volume).
    const primaryEndpoint =
      `Order/by-area-date?areaId=${encodeURIComponent(areaId)}&date=${encodeURIComponent(date)}&pageSize=1000`;

    return this.api.get<any>(primaryEndpoint).pipe(
      map((response) => {
        const items: OrderBatchProjection[] = Array.isArray(response)
          ? response
          : (response?.items ?? []);
        return this.normalizeOrders(items, areaId, false);
      }),
      catchError(() => this.api
        .get<OrderBatchProjection[] | null>(`Order/getListOfOrdersForDate/${encodeURIComponent(date)}`)
        .pipe(map((response) => this.normalizeOrders(response, areaId, true)))
      )
    );
  }

  loadMonitoring(areaId: string, date: string): Observable<BatchMonitoringResult> {
    if (!areaId || !date) {
      return of({ schedule: [], records: [], orders: [], rows: [] });
    }

    return forkJoin({
      schedule: this.getSchedule(areaId),
      records: this.getBatchRecords(areaId, date),
      orders: this.getOrdersByAreaDate(areaId, date)
    }).pipe(
      map(({ schedule, records, orders }) => ({
        schedule,
        records,
        orders,
        rows: this.buildSlotRows(schedule, orders, records)
      }))
    );
  }

  buildSlotRows(
    schedule: BatchScheduleWindow[] | null | undefined,
    orders: OrderBatchProjection[] | null | undefined,
    records: BatchRecord[] | null | undefined = []
  ): BatchSlotRow[] {
    const rowByIndex = new Map<number, BatchSlotRow>();
    const recordByBatchId = new Map<string, NormalizedBatchRecord>();
    const recordByIndex = new Map<number, NormalizedBatchRecord>();

    for (const record of records ?? []) {
      const normalized = this.normalizeRecord(record);
      if (!normalized) continue;
      if (normalized.id) {
        recordByBatchId.set(normalized.id.toLowerCase(), normalized);
      }
      recordByIndex.set(normalized.batchIndex, normalized);
    }

    for (const window of [...(schedule ?? [])].sort((a, b) => a.batchIndex - b.batchIndex)) {
      const record = recordByIndex.get(window.batchIndex);
      rowByIndex.set(window.batchIndex, this.createRowFromSchedule(window, record));
    }

    for (const record of recordByIndex.values()) {
      if (!rowByIndex.has(record.batchIndex)) {
        rowByIndex.set(record.batchIndex, this.createRowFromRecord(record));
      }
    }

    const unbatched = this.createEmptyCounts();
    let unbatchedTotal = 0;

    for (const order of orders ?? []) {
      const status = this.toMonitoringStatus(this.readString(order, 'status', 'Status'));
      if (!status) continue;

      const batchId = this.readString(order, 'batchId', 'BatchId');
      if (!batchId) {
        unbatched[status]++;
        unbatchedTotal++;
        continue;
      }

      const normalizedRecord = recordByBatchId.get(batchId.toLowerCase());
      const batchIndex = normalizedRecord?.batchIndex ?? this.extractBatchIndex(batchId);
      if (batchIndex === null) {
        continue;
      }

      let row = rowByIndex.get(batchIndex);
      if (!row) {
        row = this.createFallbackRow(batchId, batchIndex);
        rowByIndex.set(batchIndex, row);
      }

      row.counts[status]++;
      row.total++;
    }

    const rows = Array.from(rowByIndex.values()).sort((a, b) => (a.batchIndex ?? 0) - (b.batchIndex ?? 0));

    if (unbatchedTotal > 0) {
      rows.push({
        batchIndex: null,
        batchId: null,
        label: 'Unbatched',
        windowTimes: '-',
        counts: unbatched,
        total: unbatchedTotal,
        enabled: true,
        isUnbatched: true,
        hasActualRecord: false
      });
    }

    return rows;
  }

  countFor(row: BatchSlotRow, status: BatchMonitoringStatus): number {
    return row.counts[status] ?? 0;
  }

  private normalizeOrders(
    response: OrderBatchProjection[] | null,
    areaId: string,
    filterByArea: boolean
  ): OrderBatchProjection[] {
    const orders = Array.isArray(response) ? response : [];
    if (!filterByArea) {
      return orders;
    }

    return orders.filter((order) => {
      const orderAreaId = this.readString(order, 'areaId', 'AreaId');
      return orderAreaId === areaId;
    });
  }

  private createRowFromSchedule(
    window: BatchScheduleWindow,
    record: NormalizedBatchRecord | undefined
  ): BatchSlotRow {
    const label = window.label || record?.label || `Batch ${window.batchIndex}`;
    const start = window.startTimePkt || record?.startTimePkt || '';
    const end = window.endTimePkt || record?.endTimePkt || '';

    return {
      batchIndex: window.batchIndex,
      batchId: record?.id || null,
      label,
      windowTimes: this.formatWindowTimes(start, end),
      counts: this.createEmptyCounts(),
      total: 0,
      enabled: window.enabled !== false,
      isUnbatched: false,
      hasActualRecord: !!record
    };
  }

  private createRowFromRecord(record: NormalizedBatchRecord): BatchSlotRow {
    return {
      batchIndex: record.batchIndex,
      batchId: record.id || null,
      label: record.label || `Batch ${record.batchIndex}`,
      windowTimes: this.formatWindowTimes(record.startTimePkt, record.endTimePkt),
      counts: this.createEmptyCounts(),
      total: 0,
      enabled: true,
      isUnbatched: false,
      hasActualRecord: true
    };
  }

  private createFallbackRow(batchId: string, batchIndex: number): BatchSlotRow {
    return {
      batchIndex,
      batchId,
      label: `Batch ${batchIndex}`,
      windowTimes: '-',
      counts: this.createEmptyCounts(),
      total: 0,
      enabled: true,
      isUnbatched: false,
      hasActualRecord: false
    };
  }

  private normalizeRecord(record: BatchRecord): NormalizedBatchRecord | null {
    const batchIndex = this.readNumber(record, 'batchIndex', 'BatchIndex');
    if (batchIndex === null || batchIndex < 1) {
      return null;
    }

    return {
      id: this.readString(record, 'id', 'Id'),
      batchIndex,
      label: this.readString(record, 'label', 'Label'),
      startTimePkt: this.readString(record, 'startTimePkt', 'StartTimePkt'),
      endTimePkt: this.readString(record, 'endTimePkt', 'EndTimePkt')
    };
  }

  private createEmptyCounts(): Record<BatchMonitoringStatus, number> {
    return {
      approved: 0,
      processing: 0,
      packed: 0,
      dispatched: 0,
      delivered: 0,
      cancelled: 0
    };
  }

  private toMonitoringStatus(status: string): BatchMonitoringStatus | null {
    switch (status.trim().toLowerCase()) {
      case 'approved':
        return 'approved';
      case 'processing':
        return 'processing';
      case 'packed':
        return 'packed';
      case 'dispatched':
        return 'dispatched';
      case 'delivered':
        return 'delivered';
      case 'cancelled':
      case 'declined':
        return 'cancelled';
      default:
        return null;
    }
  }

  private extractBatchIndex(batchId: string): number | null {
    const lastSegment = batchId.split('-').pop() ?? '';
    const parsed = Number(lastSegment);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  private formatWindowTimes(startTime: string, endTime: string): string {
    if (!startTime || !endTime) {
      return '-';
    }

    return `${this.formatTime(startTime)} - ${this.formatTime(endTime)}`;
  }

  private formatTime(value: string): string {
    const [hourRaw, minuteRaw] = value.split(':');
    const hour = Number(hourRaw);
    const minute = Number(minuteRaw);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
      return value;
    }

    const suffix = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${suffix}`;
  }

  private readString(source: unknown, ...keys: string[]): string {
    const values = source as Record<string, unknown>;
    for (const key of keys) {
      const value = values?.[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return '';
  }

  private readNumber(source: unknown, ...keys: string[]): number | null {
    const values = source as Record<string, unknown>;
    for (const key of keys) {
      const value = values?.[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }
    return null;
  }
}
