import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';

import { PackingReportComponent } from './packing-report.component';
import { PackingService } from '../services/packing.service';

describe('PackingReportComponent', () => {
  let component: PackingReportComponent;
  let fixture: ComponentFixture<PackingReportComponent>;
  let packingService: jasmine.SpyObj<PackingService>;

  const detailPayload = {
    purchaseId: '2026-04-14-batch',
    purchaseDateKey: '2026-04-14-batch',
    purchaseDate: '2026-04-14T00:00:00',
    deliveryDate: '2026-04-15T00:00:00',
    purchaseStatus: 'Partial',
    orderCount: 2,
    readyOrderCount: 1,
    blockedOrderCount: 1,
    packedOrderCount: 0,
    orders: [
      {
        orderId: 'order-ready',
        orderStatus: 'Approved',
        packingState: 'Ready',
        blockReason: '',
        orderDate: '2026-04-14T08:00:00',
        customerName: 'Ready Customer',
        customerPhone: '0300',
        customerAddress: 'Ready Address',
        grossTotal: 100,
        itemCount: 1,
        items: [
          {
            productId: 'product-1',
            productName: 'Apples',
            unitName: 'kg',
            quantity: 2,
            purchaseStatus: 'Purchased'
          }
        ]
      },
      {
        orderId: 'order-blocked',
        orderStatus: 'Approved',
        packingState: 'Blocked',
        blockReason: 'BlockedByOutOfStock',
        orderDate: '2026-04-14T09:00:00',
        customerName: 'Blocked Customer',
        customerPhone: '0301',
        customerAddress: 'Blocked Address',
        grossTotal: 120,
        itemCount: 1,
        items: [
          {
            productId: 'product-2',
            productName: 'Bananas',
            unitName: 'kg',
            quantity: 1,
            purchaseStatus: 'Out of stock'
          }
        ]
      }
    ]
  };

  beforeEach(async () => {
    packingService = jasmine.createSpyObj<PackingService>('PackingService', ['listBatches', 'getBatch', 'markPacked']);

    packingService.listBatches.and.returnValue(of([]));
    packingService.getBatch.and.callFake((purchaseDateKey: string) => of({
      ...detailPayload,
      purchaseId: `${purchaseDateKey}-batch`,
      purchaseDateKey: `${purchaseDateKey}-batch`,
      purchaseDate: `${purchaseDateKey}T00:00:00`,
      deliveryDate: `${purchaseDateKey}T00:00:00`,
      orders: detailPayload.orders
    }));
    packingService.markPacked.and.returnValue(of({
      updatedOrderIds: ['order-ready'],
      skippedOrders: []
    }));

    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [PackingReportComponent],
      providers: [
        { provide: PackingService, useValue: packingService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(PackingReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads today by default without requesting the full batch list', () => {
    createComponent();

    expect(component.selectedPackingDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(packingService.getBatch).toHaveBeenCalledWith(component.todayIso());
    expect(packingService.listBatches).not.toHaveBeenCalled();
    expect(component.loadingDetail).toBeFalse();
    expect(component.detail?.orders.length).toBe(2);
  });

  it('loads the selected calendar date when the operator changes it', () => {
    createComponent();
    packingService.getBatch.calls.reset();

    component.selectedPackingDate = '2026-04-13';
    component.onPackingDateChange();

    expect(packingService.getBatch).toHaveBeenCalledWith('2026-04-13');
    expect(component.detail?.purchaseDateKey).toBe('2026-04-13-batch');
  });

  it('ignores stale responses from earlier selected dates', () => {
    const firstLoad = new Subject<any>();
    const secondLoad = new Subject<any>();
    packingService.getBatch.and.returnValues(firstLoad.asObservable(), secondLoad.asObservable());

    createComponent();

    component.selectedPackingDate = '2026-04-13';
    component.onPackingDateChange();

    secondLoad.next({
      ...detailPayload,
      purchaseId: '2026-04-13-batch',
      purchaseDateKey: '2026-04-13-batch'
    });
    firstLoad.next({
      ...detailPayload,
      purchaseId: 'stale-batch',
      purchaseDateKey: 'stale-batch'
    });

    expect(component.detail?.purchaseDateKey).toBe('2026-04-13-batch');
  });

  it('rejects invalid selected date values before calling the API', () => {
    createComponent();
    packingService.getBatch.calls.reset();

    component.selectedPackingDate = 'not-a-date';
    component.loadSelectedDate();

    expect(packingService.getBatch).not.toHaveBeenCalled();
    expect(component.loadingDetail).toBeFalse();
    expect(component.detailError).toContain('valid packing date');
  });

  it('shows an empty state when no packing batch exists for the selected date', () => {
    packingService.getBatch.and.returnValue(throwError(() => ({ status: 404 })));

    createComponent();

    expect(component.loadingDetail).toBeFalse();
    expect(component.noBatchForDate).toBeTrue();
    expect(component.detailError).toBe('');
    expect(component.detail).toBeNull();
  });

  it('shows a retryable error when the selected-date load times out', () => {
    packingService.getBatch.and.returnValue(throwError(() => ({ name: 'TimeoutError' })));

    createComponent();

    expect(component.loadingDetail).toBeFalse();
    expect(component.noBatchForDate).toBeFalse();
    expect(component.detailError).toContain('timed out');
  });

  it('allows only ready orders to be marked as packed', () => {
    createComponent();

    expect(component.detail).toBeTruthy();
    expect(component.isSelectable(component.detail!.orders[0])).toBeTrue();
    expect(component.isSelectable(component.detail!.orders[1])).toBeFalse();
  });

  it('marks a ready order as packed using the resolved purchase key and removes it from the visible queue', () => {
    createComponent();
    const readyOrder = component.detail!.orders.find((order) => order.orderId === 'order-ready');
    expect(readyOrder).toBeTruthy();

    component.markOrderPacked(readyOrder!);

    expect(component.detail?.orders.length).toBe(1);
    expect(component.detail?.orders.some((order) => order.orderId === 'order-ready')).toBeFalse();
    expect(component.detail?.packedOrderCount).toBe(1);
    expect(component.detail?.readyOrderCount).toBe(0);
    expect(packingService.markPacked).toHaveBeenCalledWith(`${component.selectedPackingDate}-batch`, ['order-ready']);
    expect(component.feedbackMessage).toContain('ORD#READY marked packed');
  });

  it('does not send packing updates for blocked orders', () => {
    createComponent();
    const blockedOrder = component.detail!.orders.find((order) => order.orderId === 'order-blocked');
    expect(blockedOrder).toBeTruthy();

    component.markOrderPacked(blockedOrder!);

    expect(packingService.markPacked).not.toHaveBeenCalled();
  });

  it('refreshes selected date after mark-packed times out', () => {
    createComponent();
    packingService.getBatch.calls.reset();
    packingService.markPacked.and.returnValue(throwError(() => ({ name: 'TimeoutError' })));
    const readyOrder = component.detail!.orders.find((order) => order.orderId === 'order-ready');

    component.markOrderPacked(readyOrder!);

    expect(component.feedbackMessage).toContain('Timed out');
    expect(packingService.getBatch).toHaveBeenCalledWith(component.selectedPackingDate);
  });
});
