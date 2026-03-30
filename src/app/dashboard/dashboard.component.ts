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
    { key: 'categories', label: 'Categories', route: '/dashboard/categories' },
    { key: 'products', label: 'Products', route: '/dashboard/products' },
    { key: 'account', label: 'Account', route: '/dashboard/account' },
    { key: 'settings', label: 'Settings', route: '/dashboard/settings' }
  ];

  constructor(private readonly authService: AuthService) {}

  closeNav(): void {
    this.navOpen = false;
  }

  logout(): void {
    this.closeNav();
    this.authService.logout();
  }
}
