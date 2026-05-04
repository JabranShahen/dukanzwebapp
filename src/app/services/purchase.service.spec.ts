import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { environment } from '../environments/environment';
import { PurchaseService } from './purchase.service';

describe('PurchaseService', () => {
  let service: PurchaseService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(PurchaseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deletes a purchase by id', () => {
    let result: boolean | undefined;

    service.deletePurchase('2026-05-03-abcdef12').subscribe((deleted) => {
      result = deleted;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/Purchase/2026-05-03-abcdef12`);
    expect(req.request.method).toBe('DELETE');
    req.flush(true);

    expect(result).toBeTrue();
  });

  it('lists purchases for a selected purchase date', () => {
    let result: unknown[] | undefined;

    service.listPurchases('2026-05-02').subscribe((purchases) => {
      result = purchases;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/Purchase/list?dateKey=2026-05-02`);
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: '2026-05-02-abcdef12',
        purchDate: '2026-05-02T10:00:00',
        status: 'Pending',
        total: 100,
        itemCount: 2,
        orderCount: 1
      }
    ]);

    expect(result?.length).toBe(1);
  });
});
