import { Component } from '@angular/core';

import { AuthService } from '../auth.service';

interface NavItem {
  key: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  navOpen = false;

  readonly navItems: NavItem[] = [
    { key: 'overview', label: 'Overview', route: '/dashboard' },
    { key: 'monitoring', label: 'Monitoring', route: '/dashboard/monitoring' },
    { key: 'categories', label: 'Categories', route: '/dashboard/categories' },
    { key: 'events', label: 'Events', route: '/dashboard/events' },
    { key: 'products', label: 'Products', route: '/dashboard/products' },
    { key: 'users', label: 'Users', route: '/dashboard/users' },
    { key: 'driver', label: 'Driver', route: '/dashboard/driver' },
    { key: 'orders', label: 'Orders', route: '/dashboard/orders' },
    { key: 'purchase', label: 'Create Purchase', route: '/dashboard/purchase' },
    { key: 'purchase-process', label: 'Process Purchase', route: '/dashboard/purchase-process' },
    { key: 'packing', label: 'Packing', route: '/dashboard/packing' },
    { key: 'account', label: 'Account', route: '/dashboard/account' },
    { key: 'settings', label: 'Settings', route: '/dashboard/settings' }
  ];

  constructor(private readonly authService: AuthService) {}

  closeNav(): void {
    this.navOpen = false;
  }

  logout(): void {
    this.closeNav();
    void this.authService.logout();
  }
}
