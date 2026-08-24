import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';

import { AuthService } from '../auth.service';
import { AreaService } from '../services/area.service';
import { DukanzConfigService } from '../services/dukanz-config.service';
import { OrderService } from '../services/order.service';
import { DukanzConfig } from '../models/dukanz-config.model';
import { SettingsComponent } from './settings.component';

function makeConfig(overrides: Partial<DukanzConfig> = {}): DukanzConfig {
  return {
    id: 'cfg',
    PartitionKey: 'cfg',
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
    claimsEnabled: false,
    claimsPilotAreaIds: [],
    claimWindowDays: 7,
    claimsRequirePhotos: false,
    claimsMaxPhotos: 5,
    claimsMaxPhotoSizeMb: 5,
    claimsStorageContainer: 'claims',
    claimsAttachmentRetentionDays: 90,
    claimsDocumentRetentionDays: 365,
    areaId: null,
    ...overrides
  };
}

describe('SettingsComponent', () => {
  let authService: Pick<AuthService, 'currentRole' | 'currentAreaId'>;
  let configService: jasmine.SpyObj<DukanzConfigService>;
  let areaService: jasmine.SpyObj<AreaService>;
  let orderService: jasmine.SpyObj<OrderService>;

  function createComponent(role: string = 'superadmin'): SettingsComponent {
    authService = {
      currentRole: role,
      currentAreaId: 'area-current'
    };
    configService = jasmine.createSpyObj<DukanzConfigService>('DukanzConfigService', [
      'getConfig',
      'getConfigContext',
      'save'
    ]);
    configService.getConfig.and.returnValue(of(makeConfig({ areaId: 'area-current' })));
    configService.getConfigContext.and.returnValue(of({
      effectiveConfig: makeConfig(),
      areaConfig: null,
      globalConfig: makeConfig()
    }));
    configService.save.and.returnValue(of(makeConfig()));
    areaService = jasmine.createSpyObj<AreaService>('AreaService', ['getAll']);
    areaService.getAll.and.returnValue(of([]));
    orderService = jasmine.createSpyObj<OrderService>('OrderService', ['broadcastAppUpdate']);
    orderService.broadcastAppUpdate.and.returnValue(of({ total: 0, notified: 0 }));

    return new SettingsComponent(
      authService as AuthService,
      configService,
      areaService,
      new FormBuilder(),
      orderService
    );
  }

  it('saves claims enabled for the selected area', () => {
    const component = createComponent();
    component.selectedAreaId = 'area-a';
    component.configForm.patchValue({ claimsEnabled: true });

    component.onSave();

    expect(configService.save).toHaveBeenCalledWith(
      jasmine.objectContaining({
        claimsEnabled: true,
        claimsPilotAreaIds: ['area-a']
      }),
      'area-a'
    );
  });

  it('parses global pilot area IDs when saving global claims settings', () => {
    const component = createComponent();
    component.configForm.patchValue({
      claimsEnabled: true,
      claimsPilotAreaIdsText: 'area-a, area-b, '
    });

    component.onSave();

    expect(configService.save).toHaveBeenCalledWith(
      jasmine.objectContaining({
        claimsEnabled: true,
        claimsPilotAreaIds: ['area-a', 'area-b']
      }),
      undefined
    );
  });
});
