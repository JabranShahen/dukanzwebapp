import { Component, OnInit } from '@angular/core';

import { AuthService } from '../auth.service';
import { UnallocatedCustomer } from '../models/user.model';
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

  constructor(
    public readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  ngOnInit(): void {
    this.load();
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
    if (!this.authService.currentAreaId) {
      this.feedbackTone = 'error';
      this.feedbackMessage = 'No operator area is assigned to this session.';
      return;
    }

    this.allocatingId = customerId;
    this.feedbackMessage = '';
    this.userService.allocate(customerId, this.authService.currentAreaId).subscribe({
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
