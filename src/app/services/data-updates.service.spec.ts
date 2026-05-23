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
});
