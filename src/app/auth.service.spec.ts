import { HttpErrorResponse } from '@angular/common/http';
import { Injector } from '@angular/core';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { AuthService } from './auth.service';
import { StaffAccount } from './models/staff.model';
import { DukanzUser } from './models/user.model';
import { StaffService } from './services/staff.service';
import { UserService } from './services/user.service';

describe('AuthService profile loading', () => {
  it('loads staff profile for email authenticated users', () => {
    const harness = buildHarness({
      email: 'operator@example.com',
      providerData: [{ providerId: 'password' }]
    });
    harness.staffService.getMe.and.returnValue(of({
      id: 'operator@example.com',
      name: 'Operator',
      email: 'operator@example.com',
      areaId: 'area-a',
      role: 'operator',
      enabled: true
    }));

    harness.loadUserProfile();

    expect(harness.staffService.getMe).toHaveBeenCalled();
    expect(harness.userService.getMe).not.toHaveBeenCalled();
    expect(harness.auth.currentAreaId).toBe('area-a');
    expect(harness.auth.currentRole).toBe('operator');
  });

  it('falls back gracefully when an email user has no staff record yet', () => {
    const harness = buildHarness({
      email: 'operator@example.com',
      providerData: [{ providerId: 'password' }]
    });
    harness.staffService.getMe.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    harness.loadUserProfile();

    expect(harness.auth.currentAreaId).toBeNull();
    expect(harness.auth.currentRole).toBe('operator');
  });

  it('keeps phone authenticated users on the existing user profile endpoint', () => {
    const harness = buildHarness({
      email: null,
      providerData: [{ providerId: 'phone' }]
    });
    harness.userService.getMe.and.returnValue(of({
      id: '03001111111',
      name: 'Customer',
      address: '',
      phoneNumber: '03001111111',
      enable: true,
      isDriver: false,
      email: '',
      areaId: 'area-b',
      role: 'operator'
    }));

    harness.loadUserProfile();

    expect(harness.userService.getMe).toHaveBeenCalled();
    expect(harness.staffService.getMe).not.toHaveBeenCalled();
    expect(harness.auth.currentAreaId).toBe('area-b');
  });

  it('still grants superadmin role to configured emails after Staff/me fallback', () => {
    const harness = buildHarness({
      email: 'jabran.shaheen@gmail.com',
      providerData: [{ providerId: 'password' }]
    });
    harness.staffService.getMe.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    harness.loadUserProfile();

    expect(harness.staffService.getMe).toHaveBeenCalled();
    expect(harness.auth.currentAreaId).toBeNull();
    expect(harness.auth.currentRole).toBe('superadmin');
  });

  function buildHarness(firebaseUser: { email: string | null; providerData: Array<{ providerId: string }> }) {
    const staffService = jasmine.createSpyObj<StaffService>('StaffService', ['getAll', 'getMe', 'create', 'update']);
    const userService = jasmine.createSpyObj<UserService>('UserService', ['getAll', 'getMe', 'create', 'update', 'getUnallocated', 'allocate']);

    staffService.getMe.and.returnValue(of(defaultStaff()));
    userService.getMe.and.returnValue(of(defaultUser()));

    const injector = {
      get: jasmine.createSpy('get').and.callFake((token: unknown) => {
        if (token === StaffService) return staffService;
        if (token === UserService) return userService;
        throw new Error('Unexpected dependency');
      })
    } as unknown as Injector;

    const auth = Object.create(AuthService.prototype) as AuthService;
    (auth as any).injector = injector;
    (auth as any).userSubject = new BehaviorSubject(firebaseUser as any);
    (auth as any).currentAreaIdSubject = new BehaviorSubject<string | null>(null);
    (auth as any).currentRoleSubject = new BehaviorSubject<string>('operator');
    (auth as any).profileReadySubject = new BehaviorSubject<boolean>(false);
    (auth as any).superAdminEmails = new Set([
      'jabran.shaheen@gmail.com',
      'jabranshaheen@hotmail.com'
    ]);

    return {
      auth,
      staffService,
      userService,
      loadUserProfile: () => (auth as any).loadUserProfile()
    };
  }

  function defaultStaff(): StaffAccount {
    return {
      id: 'operator@example.com',
      name: 'Operator',
      email: 'operator@example.com',
      areaId: 'area-a',
      role: 'operator',
      enabled: true
    };
  }

  function defaultUser(): DukanzUser {
    return {
      id: '03001111111',
      name: 'Customer',
      address: '',
      phoneNumber: '03001111111',
      enable: true,
      isDriver: false,
      email: '',
      areaId: 'area-b',
      role: 'operator'
    };
  }
});
