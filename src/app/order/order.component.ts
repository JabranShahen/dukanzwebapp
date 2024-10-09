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

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.orders$ = this.orderService.getOrders();
  }
}
