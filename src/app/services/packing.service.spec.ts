import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { environment } from '../environments/environment';
import { PackingService } from './packing.service';

describe('PackingService', () => {
  let service: PackingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(PackingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads packing batches from the packing list endpoint', () => {
    let batchCount = 0;

    service.listBatches().subscribe((batches) => {
      batchCount = batches.length;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/Packing/list`);
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: '2026-04-14',
        purchaseDateKey: '2026-04-14',
        purchaseDate: '2026-04-14T00:00:00',
        deliveryDate: '2026-04-15T00:00:00',
        purchaseStatus: 'Purchased',
        orderCount: 4,
        readyOrderCount: 2,
        blockedOrderCount: 1,
        packedOrderCount: 1
      }
    ]);

    expect(batchCount).toBe(1);
  });

  it('loads a single packing batch detail', () => {
    let orderCount = 0;

    service.getBatch('2026-04-14').subscribe((batch) => {
      orderCount = batch.orders.length;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/Packing/2026-04-14`);
    expect(request.request.method).toBe('GET');
    request.flush({
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
          orderId: 'order-1',
          orderStatus: 'Approved',
          packingState: 'Ready',
          blockReason: '',
          orderDate: '2026-04-14T08:00:00',
          customerName: 'A',
          customerPhone: '0300',
          customerAddress: 'Address',
          grossTotal: 123,
          itemCount: 1,
          items: []
        }
      ]
    });

    expect(orderCount).toBe(1);
  });

  it('posts selected order ids to mark packed', () => {
    let updatedCount = 0;

    service.markPacked('2026-04-14', ['order-1', 'order-2']).subscribe((result) => {
      updatedCount = result.updatedOrderIds.length;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/Packing/2026-04-14/mark-packed`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ orderIds: ['order-1', 'order-2'] });
    request.flush({
      updatedOrderIds: ['order-1'],
      skippedOrders: [{ orderId: 'order-2', reason: 'BlockedByOutOfStock' }]
    });

    expect(updatedCount).toBe(1);
  });
});
