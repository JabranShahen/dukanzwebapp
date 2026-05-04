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

  get navItems(): NavItem[] {
    const items: NavItem[] = [
      { key: 'overview', label: 'Overview', route: '/dashboard' },
      { key: 'operational-day', label: 'Ops Dashboard', route: '/dashboard/operational-day' },
      { key: 'driver', label: 'Driver', route: '/dashboard/driver' },
      { key: 'orders', label: 'Orders', route: '/dashboard/orders' },
      { key: 'purchase', label: 'Purchase Management', route: '/dashboard/purchase' },
      { key: 'packing', label: 'Packing', route: '/dashboard/packing' },
      { key: 'allocation', label: 'Customer Allocation', route: '/dashboard/allocation' },
      { key: 'account', label: 'Account', route: '/dashboard/account' }
    ];

    if (this.authService.currentRole === 'superadmin') {
      items.push(
        { key: 'areas', label: 'Area Management', route: '/dashboard/areas' },
        { key: 'users', label: 'Users', route: '/dashboard/users' },
        { key: 'products', label: 'Products', route: '/dashboard/products' },
        { key: 'categories', label: 'Categories', route: '/dashboard/categories' },
        { key: 'events', label: 'Events', route: '/dashboard/events' },
        { key: 'monitoring', label: 'Monitoring', route: '/dashboard/monitoring' },
        { key: 'settings', label: 'Settings', route: '/dashboard/settings' }
      );
    }

    return items;
  }

  constructor(private readonly authService: AuthService) {}

  closeNav(): void {
    this.navOpen = false;
  }

  logout(): void {
    this.closeNav();
    void this.authService.logout();
  }
}
