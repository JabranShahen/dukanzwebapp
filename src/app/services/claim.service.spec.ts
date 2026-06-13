import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ClaimService } from './claim.service';
import { environment } from '../environments/environment';

describe('ClaimService', () => {
  let service: ClaimService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(ClaimService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lists claims with encoded filters', () => {
    let total = -1;

    service.getClaims({
      status: 'Submitted',
      issueType: 'Expired',
      areaId: 'area-a',
      customerPhone: '0300 123'
    }).subscribe((response) => {
      total = response.totalCount;
    });

    const request = httpMock.expectOne(
      `${environment.apiBaseUrl}/Claims?status=Submitted&issueType=Expired&areaId=area-a&customerPhone=0300+123`
    );
    expect(request.request.method).toBe('GET');
    request.flush({ totalCount: 1, claims: [{ claimId: 'claim-1' }] });

    expect(total).toBe(1);
  });

  it('maps null list responses and HTTP errors to an empty queue', () => {
    let nullResult = -1;
    let errorResult = -1;

    service.getClaims().subscribe((response) => {
      nullResult = response.claims.length;
    });

    httpMock.expectOne(`${environment.apiBaseUrl}/Claims`).flush(null);
    expect(nullResult).toBe(0);

    service.getClaims({ status: 'Submitted' }).subscribe((response) => {
      errorResult = response.claims.length;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/Claims?status=Submitted`);
    request.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    expect(errorResult).toBe(0);
  });

  it('lazy-loads claim detail with signed attachment URLs only when requested', () => {
    service.getClaim('claim-1', true).subscribe();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/Claims/claim-1?includeAttachmentUrls=true`);
    expect(request.request.method).toBe('GET');
    request.flush({ claimId: 'claim-1', attachments: [] });
  });

  it('patches claim status transitions', () => {
    service.updateStatus('claim-1', {
      status: 'Approved',
      note: 'Approved refund.',
      resolution: { type: 'Refund', amount: 120, currency: 'PKR' }
    }).subscribe();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/Claims/claim-1/status`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(jasmine.objectContaining({
      status: 'Approved',
      resolution: jasmine.objectContaining({ type: 'Refund', amount: 120 })
    }));
    request.flush({ claimId: 'claim-1', status: 'Approved', updatedAtUtc: '2026-06-10T12:00:00Z' });
  });
});
