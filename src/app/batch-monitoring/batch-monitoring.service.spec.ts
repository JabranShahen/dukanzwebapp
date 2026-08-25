import { Observable, of, throwError } from 'rxjs';

import { BatchScheduleWindow } from '../models/batch-schedule.model';
import { ApiService } from '../services/api.service';
import {
  BatchMonitoringService,
  BatchRecord,
  OrderBatchProjection
} from './batch-monitoring.service';

function makeWindow(overrides: Partial<BatchScheduleWindow> = {}): BatchScheduleWindow {
  return {
    batchIndex: 1,
    label: 'Morning',
    startTimePkt: '09:00',
    endTimePkt: '13:00',
    enabled: true,
    ...overrides
  };
}

function makeOrder(overrides: Partial<OrderBatchProjection> = {}): OrderBatchProjection {
  return {
    id: 'order-1',
    areaId: 'area-1',
    status: 'Approved',
    batchId: 'area-1-2026-08-16-1',
    createdAtPk: '2026-08-16T10:00:00',
    ...overrides
  };
}

describe('BatchMonitoringService', () => {
  let service: BatchMonitoringService;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['get']);
    service = new BatchMonitoringService(api);
  });

  it('getSchedule should call GET batch/schedule/{areaId}', () => {
    api.get.and.returnValue(of([makeWindow()]));

    let result: BatchScheduleWindow[] = [];
    service.getSchedule('area-1').subscribe((windows) => (result = windows));

    expect(api.get).toHaveBeenCalledWith('batch/schedule/area-1');
    expect(result.length).toBe(1);
  });

  it('getOrdersByAreaDate falls back to date endpoint and filters by area', () => {
    api.get.and.callFake(<T>(endpoint: string): Observable<T> => {
      if (endpoint.startsWith('Order/by-area-date')) {
        return throwError(() => ({ status: 404 }));
      }

      return of([
        makeOrder({ id: 'area-1-order', areaId: 'area-1' }),
        makeOrder({ id: 'area-2-order', areaId: 'area-2' })
      ]) as unknown as Observable<T>;
    });

    let result: OrderBatchProjection[] = [];
    service.getOrdersByAreaDate('area-1', '2026-08-16').subscribe((orders) => (result = orders));

    expect(api.get).toHaveBeenCalledWith('Order/by-area-date?areaId=area-1&date=2026-08-16');
    expect(api.get).toHaveBeenCalledWith('Order/getListOfOrdersForDate/2026-08-16');
    expect(result.map((order) => order.id)).toEqual(['area-1-order']);
  });

  it('buildSlotRows_correctCounts_allStatuses', () => {
    const rows = service.buildSlotRows(
      [
        makeWindow(),
        makeWindow({ batchIndex: 2, label: 'Evening', startTimePkt: '15:00', endTimePkt: '19:00' })
      ],
      [
        makeOrder({ status: 'Approved', batchId: 'area-1-2026-08-16-1' }),
        makeOrder({ status: 'Processing', batchId: 'area-1-2026-08-16-1' }),
        makeOrder({ status: 'Cancelled', batchId: 'area-1-2026-08-16-1' }),
        makeOrder({ status: 'Packed', batchId: 'area-1-2026-08-16-2' }),
        makeOrder({ status: 'Dispatched', batchId: 'area-1-2026-08-16-2' }),
        makeOrder({ status: 'Delivered', batchId: 'area-1-2026-08-16-2' })
      ]
    );

    expect(rows[0].counts.approved).toBe(1);
    expect(rows[0].counts.processing).toBe(1);
    expect(rows[0].counts.cancelled).toBe(1);
    expect(rows[0].total).toBe(3);
    expect(rows[1].counts.packed).toBe(1);
    expect(rows[1].counts.dispatched).toBe(1);
    expect(rows[1].counts.delivered).toBe(1);
    expect(rows[1].total).toBe(3);
  });

  it('buildSlotRows_unbatchedOrders_appendedLastRow', () => {
    const rows = service.buildSlotRows(
      [makeWindow()],
      [
        makeOrder({ batchId: null }),
        makeOrder({ status: 'Delivered', batchId: '' })
      ]
    );

    expect(rows.length).toBe(2);
    expect(rows[1].label).toBe('Unbatched');
    expect(rows[1].counts.approved).toBe(1);
    expect(rows[1].counts.delivered).toBe(1);
    expect(rows[1].total).toBe(2);
  });

  it('buildSlotRows_noOrders_allZeroCounts', () => {
    const rows = service.buildSlotRows([makeWindow()], []);

    expect(rows.length).toBe(1);
    expect(rows[0].label).toBe('Morning');
    expect(rows[0].windowTimes).toBe('9:00 AM - 1:00 PM');
    expect(rows[0].total).toBe(0);
    expect(rows[0].counts.approved).toBe(0);
  });

  it('buildSlotRows_disabledWindow_markedCorrectly', () => {
    const rows = service.buildSlotRows([makeWindow({ enabled: false })], []);

    expect(rows[0].enabled).toBeFalse();
  });

  it('buildSlotRows_emptySchedule_returnsUnbatchedOnlyIfOrdersExist', () => {
    const noOrders = service.buildSlotRows([], []);
    const withUnbatched = service.buildSlotRows([], [makeOrder({ batchId: null })]);

    expect(noOrders).toEqual([]);
    expect(withUnbatched.length).toBe(1);
    expect(withUnbatched[0].label).toBe('Unbatched');
  });

  it('buildSlotRows_mergesActualBatchRecordsWhenScheduleRowIsMissing', () => {
    const records: BatchRecord[] = [
      {
        id: 'area-1-2026-08-16-3',
        batchIndex: 3,
        label: 'Late',
        startTimePkt: '20:00',
        endTimePkt: '22:00'
      }
    ];

    const rows = service.buildSlotRows([], [makeOrder({ batchId: 'area-1-2026-08-16-3' })], records);

    expect(rows.length).toBe(1);
    expect(rows[0].batchIndex).toBe(3);
    expect(rows[0].label).toBe('Late');
    expect(rows[0].counts.approved).toBe(1);
    expect(rows[0].hasActualRecord).toBeTrue();
  });
});
