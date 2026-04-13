import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';

import { Order, OrderStatusAction, STATUS_ACTIONS } from '../../models/order.model';
import { DukanzUser } from '../../models/user.model';
import { OrderService } from '../../services/order.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-order-panel',
  templateUrl: './order-panel.component.html',
  styleUrls: ['./order-panel.component.scss']
})
export class OrderPanelComponent implements OnInit, OnChanges {
  @Input() order!: Order;
  @Output() closed = new EventEmitter<void>();
  @Output() orderUpdated = new EventEmitter<void>();

  drivers: DukanzUser[] = [];
  selectedDriverId = '';
  driverLoading = false;
  driverError = '';
  updatingStatus = false;
  updatingDriver = false;

  feedbackMessage = '';
  feedbackTone: 'success' | 'error' = 'success';

  constructor(
    private readonly orderService: OrderService,
    private readonly userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadDrivers();
    this.preselectDriver();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['order'] && !changes['order'].firstChange) {
      this.preselectDriver();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }

  loadDrivers(): void {
    this.driverLoading = true;
    this.driverError = '';
    this.userService.getAll().subscribe({
      next: (users) => {
        this.driverLoading = false;
        this.drivers = users
          .filter(u => u.isDriver && u.enable)
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      },
      error: () => {
        this.driverLoading = false;
        this.driverError = 'Could not load drivers.';
      }
    });
  }

  preselectDriver(): void {
    this.selectedDriverId = this.order?.driver?.id ?? '';
  }

  getActions(): OrderStatusAction[] {
    return STATUS_ACTIONS[this.order.status] ?? [];
  }

  applyAction(action: OrderStatusAction): void {
    if (this.updatingStatus) return;
    this.updatingStatus = true;

    this.orderService.updateStatus(this.order, action.nextStatus).subscribe({
      next: () => {
        this.updatingStatus = false;
        this.feedbackTone = 'success';
        this.feedbackMessage = `Order ${this.shortId(this.order.id)} → ${action.nextStatus}`;
        this.orderUpdated.emit();
      },
      error: () => {
        this.updatingStatus = false;
        this.feedbackTone = 'error';
        this.feedbackMessage = 'Failed to update order status.';
      }
    });
  }

  assignDriver(): void {
    if (!this.canAssign() || this.updatingDriver) return;
    this.updatingDriver = true;

    const driver = this.drivers.find(d => d.id === this.selectedDriverId) ?? null;
    this.orderService.assignDriver(this.order, driver).subscribe({
      next: () => {
        this.updatingDriver = false;
        this.feedbackTone = 'success';
        this.feedbackMessage = 'Driver assigned.';
        this.orderUpdated.emit();
      },
      error: () => {
        this.updatingDriver = false;
        this.feedbackTone = 'error';
        this.feedbackMessage = 'Failed to update driver.';
        this.preselectDriver();
      }
    });
  }

  unassignDriver(): void {
    if (this.updatingDriver) return;
    this.updatingDriver = true;

    this.orderService.assignDriver(this.order, null).subscribe({
      next: () => {
        this.updatingDriver = false;
        this.feedbackTone = 'success';
        this.feedbackMessage = 'Driver unassigned.';
        this.orderUpdated.emit();
      },
      error: () => {
        this.updatingDriver = false;
        this.feedbackTone = 'error';
        this.feedbackMessage = 'Failed to update driver.';
        this.preselectDriver();
      }
    });
  }

  canAssign(): boolean {
    return (
      this.selectedDriverId !== '' &&
      this.selectedDriverId !== (this.order.driver?.id ?? '')
    );
  }

  statusTone(status: string): 'success' | 'muted' {
    switch (status) {
      case 'Sending':
      case 'Approved':
      case 'Processing':
      case 'Dispatched':
      case 'Canceling':
        return 'success';
      default:
        return 'muted';
    }
  }

  shortId(id: string): string {
    return ('ORD#' + (id || '').slice(-5)).toUpperCase();
  }

  ageLabel(): string {
    if (!this.order?.orderDeviceDttm) return '—';
    const ms = Date.now() - new Date(this.order.orderDeviceDttm).getTime();
    const mins = Math.floor(ms / 60_000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ${mins % 60}m ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  isOld(): boolean {
    if (!this.order?.orderDeviceDttm) return false;
    const ms = Date.now() - new Date(this.order.orderDeviceDttm).getTime();
    return ms > 24 * 60 * 60 * 1000;
  }

  formatDateTime(dateStr: string): string {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return '—';
    }
  }

  onFeedbackDismissed(): void {
    this.feedbackMessage = '';
  }
}
