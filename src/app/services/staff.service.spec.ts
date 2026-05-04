import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { environment } from '../environments/environment';
import { CreateStaffRequest, StaffAccount } from '../models/staff.model';
import { StaffService } from './staff.service';

describe('StaffService', () => {
  let service: StaffService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(StaffService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets all staff accounts', () => {
    let result: StaffAccount[] | undefined;
    const staff: StaffAccount[] = [
      { id: 'operator@example.com', name: 'Operator', email: 'operator@example.com', areaId: 'area-a', role: 'operator', enabled: true }
    ];

    service.getAll().subscribe((response) => {
      result = response;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/Staff`);
    expect(req.request.method).toBe('GET');
    req.flush(staff);

    expect(result).toEqual(staff);
  });

  it('maps a null staff list response to an empty array', () => {
    let result: StaffAccount[] | undefined;

    service.getAll().subscribe((response) => {
      result = response;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/Staff`);
    req.flush(null);

    expect(result).toEqual([]);
  });

  it('gets the current staff profile', () => {
    let result: StaffAccount | undefined;
    const staff: StaffAccount = {
      id: 'admin@example.com',
      name: 'Admin',
      email: 'admin@example.com',
      areaId: null,
      role: 'superadmin',
      enabled: true
    };

    service.getMe().subscribe((response) => {
      result = response;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/Staff/me`);
    expect(req.request.method).toBe('GET');
    req.flush(staff);

    expect(result).toEqual(staff);
  });

  it('posts a create staff request', () => {
    const payload: CreateStaffRequest = {
      name: 'Operator',
      email: 'operator@example.com',
      password: 'password-123',
      areaId: 'area-a',
      role: 'operator'
    };
    let result: { id: string } | undefined;

    service.create(payload).subscribe((response) => {
      result = response;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/Staff`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 'operator@example.com' });

    expect(result).toEqual({ id: 'operator@example.com' });
  });

  it('puts a staff patch by id', () => {
    const patch: Partial<StaffAccount> = {
      name: 'Operator Updated',
      areaId: null,
      role: 'operator',
      enabled: false
    };

    service.update('operator@example.com', patch).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/Staff/operator@example.com`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(patch);
    req.flush({ updated: true });
  });
});
