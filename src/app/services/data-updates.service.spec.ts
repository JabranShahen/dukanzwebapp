import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { environment } from '../environments/environment';
import { DataUpdatesService } from './data-updates.service';

describe('DataUpdatesService', () => {
  let service: DataUpdatesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(DataUpdatesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('posts an empty payload to reset purchase data', () => {
    let result: { scannedOrderCount: number; updatedOrderCount: number } | undefined;

    service.resetPurchase().subscribe((response) => {
      result = response;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/DataUpdates/reset-purchase`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ scannedOrderCount: 12, updatedOrderCount: 5 });

    expect(result).toEqual({ scannedOrderCount: 12, updatedOrderCount: 5 });
  });

  it('posts orderIds in the payload when provided', () => {
    service.resetPurchase(['id-1', 'id-2']).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/DataUpdates/reset-purchase`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ orderIds: ['id-1', 'id-2'] });
    req.flush({ scannedOrderCount: 2, updatedOrderCount: 1 });
  });

  it('posts empty payload when orderIds is an empty array', () => {
    service.resetPurchase([]).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/DataUpdates/reset-purchase`);
    expect(req.request.body).toEqual({});
    req.flush({ scannedOrderCount: 0, updatedOrderCount: 0 });
  });

  it('posts empty payload to reset packing when no orderIds provided', () => {
    service.resetPacking().subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/DataUpdates/reset-packing`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ scannedOrderCount: 3, updatedOrderCount: 2 });
  });

  it('posts orderIds to reset-packing when provided', () => {
    service.resetPacking(['id-1', 'id-2']).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/DataUpdates/reset-packing`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ orderIds: ['id-1', 'id-2'] });
    req.flush({ scannedOrderCount: 2, updatedOrderCount: 1 });
  });
});
