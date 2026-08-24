import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { environment } from '../environments/environment';
import { UserService } from './user.service';

describe('UserService area endpoints', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets the current user profile', () => {
    let role = '';

    service.getMe().subscribe((user) => {
      role = user.role || '';
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/User/me`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'u1', name: 'User', address: '', phoneNumber: '0300', enable: true, isDriver: false, role: 'operator' });

    expect(role).toBe('operator');
  });

  it('maps null unallocated response to an empty array', () => {
    let result: unknown[] | undefined;

    service.getUnallocated().subscribe((customers) => {
      result = customers;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/User/unallocated`);
    expect(req.request.method).toBe('GET');
    req.flush(null);

    expect(result).toEqual([]);
  });

  it('allocates a customer to an area', () => {
    let updated = 0;

    service.allocate('customer-1', 'area-a').subscribe((response) => {
      updated = response.ordersUpdated;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/User/customer-1/allocate`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ areaId: 'area-a' });
    req.flush({ allocated: true, ordersUpdated: 2 });

    expect(updated).toBe(2);
  });
});
