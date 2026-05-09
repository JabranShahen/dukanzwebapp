import { Component, OnInit } from '@angular/core';

import { AuthService } from '../auth.service';
import { Area } from '../models/area.model';
import { UnallocatedCustomer } from '../models/user.model';
import { AreaService } from '../services/area.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-customer-allocation',
  templateUrl: './customer-allocation.component.html',
  styleUrls: ['./customer-allocation.component.scss']
})
export class CustomerAllocationComponent implements OnInit {
  loading = false;
  error = '';
  customers: UnallocatedCustomer[] = [];
  allocatingId: string | null = null;
  feedbackMessage = '';
  feedbackTone: 'success' | 'error' = 'success';

  areas: Area[] = [];
  selectedAreaId = '';

  get effectiveAreaId(): string | null {
    return this.authService.currentAreaId ?? (this.selectedAreaId || null);
  }

  constructor(
    public readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly areaService: AreaService
  ) {}

  ngOnInit(): void {
    this.load();
    if (!this.authService.currentAreaId) {
      this.areaService.getAll().subscribe({
        next: (areas) => { this.areas = areas; }
      });
    }
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.userService.getUnallocated().subscribe({
      next: (customers) => {
        this.customers = customers;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load unallocated customers.';
        this.loading = false;
      }
    });
  }

  onAllocate(customerId: string): void {
    const areaId = this.effectiveAreaId;
    if (!areaId) {
      this.feedbackTone = 'error';
      this.feedbackMessage = 'Select an area before assigning customers.';
      return;
    }

    this.allocatingId = customerId;
    this.feedbackMessage = '';
    this.userService.allocate(customerId, areaId).subscribe({
      next: (result) => {
        this.allocatingId = null;
        this.feedbackTone = 'success';
        this.feedbackMessage = `Customer assigned. ${result.ordersUpdated} pending order(s) updated.`;
        this.customers = this.customers.filter((customer) => customer.id !== customerId);
      },
      error: (err) => {
        this.allocatingId = null;
        this.feedbackTone = 'error';
        this.feedbackMessage = err?.status === 409
          ? 'This customer was already assigned by another operator.'
          : 'Failed to assign customer. Please try again.';
      }
    });
  }

  onFeedbackDismissed(): void {
    this.feedbackMessage = '';
  }

  trackById(_: number, customer: UnallocatedCustomer): string {
    return customer.id;
  }
}
