import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Order } from '../businesslogic/entities/order';
import { OrderService } from '../businesslogic/services/order.service';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent implements OnInit {
  orders$: Observable<Order[]> = new Observable<Order[]>();
  selectedOrder?: Order;
  temporaryStatus: string = ''; // Temporary property for status

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.orders$ = this.orderService.getOrders();
  }

  selectOrder(order: Order): void {
    this.selectedOrder = { ...order, orderItems: order.orderItems || [] };
    this.temporaryStatus = order.status; // Initialize temporaryStatus when an order is selected
  }

// Assume OrderService is already injected in the constructor as orderService

updateOrderStatus(): void {
  if (this.selectedOrder) {
    this.selectedOrder.status = this.temporaryStatus; // Set the new status
    this.orderService.updateOrder(this.selectedOrder) // Call the service to update the order
      .then(() => console.log('Order updated successfully'))
      .catch(error => console.error('Error updating order:', error));
  }
}
  
}
