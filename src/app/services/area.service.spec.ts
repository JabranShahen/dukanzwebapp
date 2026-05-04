import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { environment } from '../environments/environment';
import { AreaService } from './area.service';

describe('AreaService', () => {
  let service: AreaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(AreaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('maps a null area list response to an empty array', () => {
    let result: unknown[] | undefined;

    service.getAll().subscribe((areas) => {
      result = areas;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/Area`);
    expect(req.request.method).toBe('GET');
    req.flush(null);

    expect(result).toEqual([]);
  });

  it('posts a new enabled area by name', () => {
    let result: { id: string } | undefined;

    service.create('Lahore').subscribe((response) => {
      result = response;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/Area`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Lahore', enabled: true });
    req.flush({ id: 'area-a' });

    expect(result).toEqual({ id: 'area-a' });
  });

  it('puts an updated area by id', () => {
    service.update({ id: 'area-a', name: 'Lahore', enabled: false }).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/Area/area-a`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ id: 'area-a', name: 'Lahore', enabled: false });
    req.flush({ updated: true });
  });
});
