import { Component, OnInit } from '@angular/core';

import { DukanzUser } from '../models/user.model';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  loading = false;
  error = '';
  successMessage = '';

  allUsers: DukanzUser[] = [];
  filterText = '';
  filterStatus: 'all' | 'enabled' | 'disabled' = 'all';
  filterRole: 'all' | 'customer' | 'driver' = 'all';

  updatingId: string | null = null;

  constructor(private readonly userService: UserService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.userService.getAll().subscribe({
      next: (users) => {
        this.allUsers = users.sort((a, b) => a.name.localeCompare(b.name));
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load users.';
        this.loading = false;
      }
    });
  }

  get filteredUsers(): DukanzUser[] {
    const q = this.filterText.trim().toLowerCase();
    return this.allUsers.filter((u) => {
      if (this.filterStatus === 'enabled' && !u.enable) return false;
      if (this.filterStatus === 'disabled' && u.enable) return false;
      if (this.filterRole === 'customer' && u.isDriver) return false;
      if (this.filterRole === 'driver' && !u.isDriver) return false;
      if (!q) return true;
      return (
        u.name?.toLowerCase().includes(q) ||
        u.phoneNumber?.toLowerCase().includes(q) ||
        u.address?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    });
  }

  get userCountLabel(): string {
    const total = this.filteredUsers.length;
    const all = this.allUsers.length;
    return total === all ? `${total} user${total !== 1 ? 's' : ''}` : `${total} of ${all}`;
  }

  clearFilters(): void {
    this.filterText = '';
    this.filterStatus = 'all';
    this.filterRole = 'all';
  }

  get hasActiveFilter(): boolean {
    return this.filterText.trim() !== '' || this.filterStatus !== 'all' || this.filterRole !== 'all';
  }

  toggleEnable(user: DukanzUser): void {
    const updated = { ...user, enable: !user.enable };
    this.updatingId = user.id;
    this.error = '';
    this.successMessage = '';
    this.userService.update(updated).subscribe({
      next: () => {
        user.enable = updated.enable;
        this.updatingId = null;
        this.successMessage = `${user.name} ${user.enable ? 'enabled' : 'disabled'}.`;
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: () => {
        this.error = `Failed to update ${user.name}.`;
        this.updatingId = null;
      }
    });
  }

  toggleDriver(user: DukanzUser): void {
    const updated = { ...user, isDriver: !user.isDriver };
    this.updatingId = user.id;
    this.error = '';
    this.successMessage = '';
    this.userService.update(updated).subscribe({
      next: () => {
        user.isDriver = updated.isDriver;
        this.updatingId = null;
        this.successMessage = `${user.name} role updated.`;
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: () => {
        this.error = `Failed to update ${user.name}.`;
        this.updatingId = null;
      }
    });
  }

  trackById(_: number, user: DukanzUser): string {
    return user.id;
  }
}
