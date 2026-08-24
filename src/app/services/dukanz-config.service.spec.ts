import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { environment } from '../environments/environment';
import { DukanzConfigMutation } from '../models/dukanz-config.model';
import { DukanzConfigService } from './dukanz-config.service';

function makePayload(overrides: Partial<DukanzConfigMutation> = {}): DukanzConfigMutation {
  return {
    message: '',
    deliveryCharges: 0,
    minOrderSize: 0,
    maxOrderSize: 0,
    freeDeliveryOrderSize: 0,
    cutoffTime: '',
    maxNumberOfActiveOrders: 0,
    minOrderActiveScreenPresenseHours: 0,
    maxNumberOfHistoryOrders: 0,
    contactPhoneNumber: '',
    deliveryOffsetDays: 1,
    latestAppVersion: '',
    minimumSupportedAppVersion: '',
    appUpgradePlayStoreUrl: '',
    forceAppUpgrade: false,
    claimsEnabled: true,
    claimsPilotAreaIds: ['area-a'],
    claimWindowDays: 7,
    claimsRequirePhotos: false,
    claimsMaxPhotos: 5,
    claimsMaxPhotoSizeMb: 5,
    claimsStorageContainer: 'claims',
    claimsAttachmentRetentionDays: 90,
    claimsDocumentRetentionDays: 365,
    ...overrides
  };
}

describe('DukanzConfigService', () => {
  let service: DukanzConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(DukanzConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('normalizes claims settings from config responses', () => {
    let claimsEnabled = false;
    let pilotAreas: string[] = [];

    service.getConfig('area-a').subscribe((config) => {
      claimsEnabled = !!config?.claimsEnabled;
      pilotAreas = config?.claimsPilotAreaIds ?? [];
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/DukanzConfig?areaId=area-a`);
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 'cfg', claimsEnabled: true, claimsPilotAreaIds: ['area-a', ''] }]);

    expect(claimsEnabled).toBeTrue();
    expect(pilotAreas).toEqual(['area-a']);
  });

  it('saves claims settings in the config mutation payload', () => {
    service.save(makePayload({ claimsPilotAreaIds: [' area-a ', 'area-b'] }), 'area-a').subscribe();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/DukanzConfig?areaId=area-a`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(jasmine.objectContaining({
      claimsEnabled: true,
      claimsPilotAreaIds: ['area-a', 'area-b'],
      claimWindowDays: 7,
      claimsRequirePhotos: false,
      claimsMaxPhotos: 5,
      claimsMaxPhotoSizeMb: 5,
      claimsStorageContainer: 'claims',
      claimsAttachmentRetentionDays: 90,
      claimsDocumentRetentionDays: 365
    }));
    request.flush({ updated: true, entity: makePayload({ id: 'cfg' }) });
  });
});
