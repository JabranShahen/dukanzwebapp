import { BehaviorSubject } from 'rxjs';

import { AuthService } from '../auth.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  it('shows Customers instead of Users for superadmins', () => {
    const role$ = new BehaviorSubject<string>('superadmin');
    const authService = {
      currentRole: 'superadmin',
      currentRole$: role$.asObservable(),
      logout: jasmine.createSpy('logout')
    } as unknown as AuthService;
    const component = new DashboardComponent(authService);

    component.ngOnInit();

    expect(component.navItems).toContain(jasmine.objectContaining({
      key: 'customers',
      label: 'Customers',
      route: '/dashboard/customers'
    }));
    expect(component.navItems).toContain(jasmine.objectContaining({
      key: 'staff',
      label: 'Staff',
      route: '/dashboard/staff'
    }));
    expect(component.navItems).toContain(jasmine.objectContaining({
      key: 'data-updates',
      label: 'Data Updates',
      route: '/dashboard/data-updates'
    }));
    expect(component.navItems.some((item) => item.key === 'users' || item.route === '/dashboard/users')).toBeFalse();
  });

  it('does not show Data Updates for operators', () => {
    const role$ = new BehaviorSubject<string>('operator');
    const authService = {
      currentRole: 'operator',
      currentRole$: role$.asObservable(),
      logout: jasmine.createSpy('logout')
    } as unknown as AuthService;
    const component = new DashboardComponent(authService);

    component.ngOnInit();

    expect(component.navItems.some((item) => item.key === 'data-updates')).toBeFalse();
  });
});
