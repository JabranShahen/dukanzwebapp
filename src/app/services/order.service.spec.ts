import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { OrderService } from './order.service';
import { environment } from '../environments/environment';

describe('OrderService.getOrdersByIds', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('posts ids to the batch endpoint and returns the orders', () => {
    let result: unknown[] = [];

    service.getOrdersByIds(['order-a', 'order-b']).subscribe((orders) => {
      result = orders;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/Order/batch`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ ids: ['order-a', 'order-b'] });
    req.flush([
      { id: 'order-a', status: 'Approved', orderGrossPrice: 100 },
      { id: 'order-b', status: 'Packed', orderGrossPrice: 200 }
    ]);

    expect(result.length).toBe(2);
  });

  it('maps a null response to an empty array', () => {
    let result: unknown[] | undefined;

    service.getOrdersByIds(['order-a']).subscribe((orders) => {
      result = orders;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/Order/batch`);
    req.flush(null);

    expect(result).toEqual([]);
  });

  it('returns an empty array on HTTP error', () => {
    let result: unknown[] | undefined;

    service.getOrdersByIds(['order-a']).subscribe((orders) => {
      result = orders;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/Order/batch`);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(result).toEqual([]);
  });
});
