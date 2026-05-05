import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { AuthService } from '../auth.service';
import { Area } from '../models/area.model';
import { DukanzUser } from '../models/user.model';
import { AreaService } from '../services/area.service';
import { UserService } from '../services/user.service';
import { CustomerManagementComponent } from './customer-management.component';

describe('CustomerManagementComponent', () => {
  let component: CustomerManagementComponent;
  let fixture: ComponentFixture<CustomerManagementComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let areaService: jasmine.SpyObj<AreaService>;
  let authService: Pick<AuthService, 'currentRole'>;

  const accounts: DukanzUser[] = [
    {
      id: '+447700900111',
      name: 'Customer Account',
      address: '1 Market Street',
      phoneNumber: '+447700900111',
      enable: true,
      isDriver: false,
      email: 'customer@example.com',
      areaId: 'area-a'
    },
    {
      id: '+447700900222',
      name: 'Driver Account',
      address: '2 Market Street',
      phoneNumber: '+447700900222',
      enable: true,
      isDriver: true,
      email: 'driver@example.com',
      areaId: null
    },
    {
      id: 'staff@example.com',
      name: 'Staff Account',
      address: '',
      phoneNumber: '',
      enable: true,
      isDriver: false,
      email: 'staff@example.com',
      areaId: 'area-a',
      role: 'operator'
    }
  ];
  const areas: Area[] = [
    { id: 'area-a', name: 'Lahore', enabled: true }
  ];

  beforeEach(async () => {
    userService = jasmine.createSpyObj<UserService>('UserService', ['getAll', 'getMe', 'create', 'update', 'getUnallocated', 'allocate']);
    areaService = jasmine.createSpyObj<AreaService>('AreaService', ['getAll', 'create', 'update']);
    authService = { currentRole: 'superadmin' };

    userService.getAll.and.returnValue(of(accounts));
    userService.update.and.returnValue(of({ updated: true }));
    areaService.getAll.and.returnValue(of(areas));

    await TestBed.configureTestingModule({
      declarations: [CustomerManagementComponent],
      imports: [FormsModule],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: AreaService, useValue: areaService },
        { provide: AuthService, useValue: authService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(CustomerManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads only phone-based customer and driver accounts', () => {
    createComponent();

    expect(component.allUsers.map((user) => user.name)).toEqual(['Customer Account', 'Driver Account']);
    expect(fixture.nativeElement.textContent).toContain('Customer Account');
    expect(fixture.nativeElement.textContent).toContain('Driver Account');
    expect(fixture.nativeElement.textContent).not.toContain('Staff Account');
  });

  it('does not render staff creation or system role controls', () => {
    createComponent();

    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('Create operator');
    expect(text).not.toContain('System Role');
    expect(text).not.toContain('Super-admin');
  });

  it('keeps customer and driver filters scoped to phone accounts', () => {
    createComponent();

    component.filterRole = 'customer';
    expect(component.filteredUsers.map((user) => user.name)).toEqual(['Customer Account']);

    component.filterRole = 'driver';
    expect(component.filteredUsers.map((user) => user.name)).toEqual(['Driver Account']);
  });
});
