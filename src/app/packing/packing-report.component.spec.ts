import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { PackingReportComponent } from './packing-report.component';
import { PackingService } from '../services/packing.service';

describe('PackingReportComponent', () => {
  let component: PackingReportComponent;
  let fixture: ComponentFixture<PackingReportComponent>;
  let packingService: jasmine.SpyObj<PackingService>;
  let batchDetailCallCount = 0;

  const listPayload = [
    {
      id: '2026-04-14',
      purchaseDateKey: '2026-04-14',
      purchaseDate: '2026-04-14T00:00:00',
      deliveryDate: '2026-04-15T00:00:00',
      purchaseStatus: 'Partial',
      orderCount: 2,
      readyOrderCount: 1,
      blockedOrderCount: 1,
      packedOrderCount: 0
    }
  ];

  const detailPayload = {
    purchaseId: '2026-04-14',
    purchaseDateKey: '2026-04-14',
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
    batchDetailCallCount = 0;

    packingService.listBatches.and.returnValue(of(listPayload));
    packingService.getBatch.and.callFake(() => {
      batchDetailCallCount += 1;
      return of({
        ...detailPayload,
        packedOrderCount: batchDetailCallCount > 1 ? 1 : 0,
        readyOrderCount: batchDetailCallCount > 1 ? 0 : 1,
        orders: batchDetailCallCount > 1
          ? detailPayload.orders.map((order) =>
              order.orderId === 'order-ready'
                ? { ...order, packingState: 'Packed', orderStatus: 'Packed' }
                : order)
          : detailPayload.orders
      });
    });
    packingService.markPacked.and.returnValue(of({
      updatedOrderIds: ['order-ready'],
      skippedOrders: []
    }));

    await TestBed.configureTestingModule({
      declarations: [PackingReportComponent],
      providers: [
        { provide: PackingService, useValue: packingService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(PackingReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the newest packing batch by default', () => {
    expect(component.selectedBatchKey).toBe('2026-04-14');
    expect(component.detail?.orders.length).toBe(2);
    expect(packingService.getBatch).toHaveBeenCalledWith('2026-04-14');
  });

  it('renders blocked orders as disabled for selection', () => {
    const checkboxes = fixture.debugElement.queryAll(By.css('input[type="checkbox"]'));
    expect(checkboxes.length).toBe(2);
    expect((checkboxes[0].nativeElement as HTMLInputElement).disabled).toBeFalse();
    expect((checkboxes[1].nativeElement as HTMLInputElement).disabled).toBeTrue();
  });

  it('marks selected ready orders as packed and refreshes the batch detail', () => {
    component.toggleOrder('order-ready', true);
    component.markPacked();

    expect(packingService.markPacked).toHaveBeenCalledWith('2026-04-14', ['order-ready']);
    expect(packingService.getBatch).toHaveBeenCalledTimes(2);
    expect(component.detail?.packedOrderCount).toBe(1);
    expect(component.selectedCount).toBe(0);
    expect(component.feedbackMessage).toContain('1 order marked packed');
  });
});
