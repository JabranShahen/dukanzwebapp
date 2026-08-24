import { HttpErrorResponse } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { AuthService } from '../auth.service';
import { Area } from '../models/area.model';
import { StaffAccount } from '../models/staff.model';
import { AreaService } from '../services/area.service';
import { StaffService } from '../services/staff.service';
import { StaffManagementComponent } from './staff-management.component';

describe('StaffManagementComponent', () => {
  let component: StaffManagementComponent;
  let fixture: ComponentFixture<StaffManagementComponent>;
  let staffService: jasmine.SpyObj<StaffService>;
  let areaService: jasmine.SpyObj<AreaService>;
  let authService: Pick<AuthService, 'currentRole'>;

  const staff: StaffAccount[] = [
    { id: 'admin@example.com', name: 'Admin', email: 'admin@example.com', areaId: null, role: 'superadmin', enabled: true },
    { id: 'operator@example.com', name: 'Operator', email: 'operator@example.com', areaId: 'area-a', role: 'operator', enabled: false }
  ];
  const areas: Area[] = [
    { id: 'area-a', name: 'Lahore', enabled: true }
  ];

  beforeEach(async () => {
    staffService = jasmine.createSpyObj<StaffService>('StaffService', ['getAll', 'getMe', 'create', 'update']);
    areaService = jasmine.createSpyObj<AreaService>('AreaService', ['getAll', 'create', 'update']);
    authService = { currentRole: 'superadmin' };

    staffService.getAll.and.returnValue(of(staff));
    staffService.create.and.returnValue(of({ id: 'new@example.com' }));
    staffService.update.and.returnValue(of({ updated: true }));
    areaService.getAll.and.returnValue(of(areas));

    await TestBed.configureTestingModule({
      declarations: [StaffManagementComponent],
      imports: [FormsModule],
      providers: [
        { provide: StaffService, useValue: staffService },
        { provide: AreaService, useValue: areaService },
        { provide: AuthService, useValue: authService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(StaffManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('renders staff returned by the service', () => {
    createComponent();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('operator@example.com');
    expect(component.staff.some((account) => account.name === 'Admin')).toBeTrue();
    expect(staffService.getAll).toHaveBeenCalled();
  });

  it('shows an empty state when there are no staff accounts', () => {
    staffService.getAll.and.returnValue(of([]));

    createComponent();

    expect(component.staff).toEqual([]);
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });

  it('validates required create fields', () => {
    createComponent();

    component.create();

    expect(staffService.create).not.toHaveBeenCalled();
    expect(component.error).toBe('Name, email, and password are required.');
  });

  it('creates staff, refreshes the list, and shows feedback', () => {
    createComponent();
    component.newStaff = {
      name: 'New Staff',
      email: 'new@example.com',
      password: 'password-123',
      areaId: 'area-a',
      role: 'operator'
    };

    component.create();

    expect(staffService.create).toHaveBeenCalledWith({
      name: 'New Staff',
      email: 'new@example.com',
      password: 'password-123',
      areaId: 'area-a',
      role: 'operator'
    });
    expect(staffService.getAll).toHaveBeenCalledTimes(2);
    expect(component.feedbackMessage).toBe('Staff member created.');
  });

  it('shows the conflict message when create returns 409', () => {
    staffService.create.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    createComponent();
    component.newStaff = {
      name: 'Existing Staff',
      email: 'existing@example.com',
      password: 'password-123',
      areaId: null,
      role: 'operator'
    };

    component.create();

    expect(component.feedbackMessage).toBe('A staff member with this email already exists.');
    expect(component.feedbackTone).toBe('error');
  });

  it('shows infrastructure failure messages from create responses', () => {
    staffService.create.and.returnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
    createComponent();
    component.newStaff = {
      name: 'New Staff',
      email: 'new@example.com',
      password: 'password-123',
      areaId: null,
      role: 'operator'
    };

    component.create();

    expect(component.feedbackMessage).toBe('Staff data store or Firebase Auth is unavailable.');
    expect(component.feedbackTone).toBe('error');
  });

  it('saves edits from the row draft', () => {
    createComponent();
    component.draftStaff['operator@example.com'].name = 'Updated Operator';
    component.draftStaff['operator@example.com'].areaId = null;
    component.draftStaff['operator@example.com'].role = 'operator';
    component.draftStaff['operator@example.com'].enabled = true;

    component.save(staff[1]);

    expect(staffService.update).toHaveBeenCalledWith('operator@example.com', {
      name: 'Updated Operator',
      areaId: null,
      role: 'operator',
      enabled: true
    });
  });

  it('does not load staff for non-superadmins', () => {
    authService.currentRole = 'operator';

    createComponent();

    expect(staffService.getAll).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Staff management is restricted');
  });
});
