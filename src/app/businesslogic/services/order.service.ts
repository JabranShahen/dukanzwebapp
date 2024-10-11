import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Order } from '../entities/order';
import { ApiService } from './apiservice';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private orders: BehaviorSubject<Order[]> = new BehaviorSubject<Order[]>([]);

  constructor(private apiService: ApiService) {
    this.loadOrders();
  }

  getOrders(): Observable<Order[]> {
    return this.orders.asObservable();
  }

  private loadOrders(): void {
    this.apiService.get<Order[]>('Order/all').pipe( // Ensure correct endpoint name
      catchError(error => {
        console.error('Error getting orders:', error);
        return of([]);  // Return an empty array in case of error
      })
    ).subscribe(
      orders => {
        this.orders.next(orders || []);
        console.log('Total number of Orders:', orders.length);
      }
    );
  }

  async getCustomerActiveOrders(customerPhoneNumber: string): Promise<Order[]> {
    try {
      const orders = await this.apiService.get<Order[]>(`Order/customeractive/${customerPhoneNumber}`).toPromise();
      return orders || [];
    } catch (error) {
      console.error('Error getting customer active orders:', error);
      return [];
    }
  }

  async getListOfOrdersForDriverToSelect(dt: Date): Promise<Order[]> {
    try {
      const orders = await this.apiService.get<Order[]>(`Order/getListOfOrdersForDriverToSelect/${dt.toISOString()}`).toPromise();
      return orders || [];
    } catch (error) {
      console.error('Error getting orders for driver selection:', error);
      return [];
    }
  }

  async getListOfOrdersForDelivery(driverId: string): Promise<Order[]> {
    try {
      const orders = await this.apiService.get<Order[]>(`Order/getListOfOrdersForDelivery/${driverId}`).toPromise();
      return orders || [];
    } catch (error) {
      console.error('Error getting orders for delivery:', error);
      return [];
    }
  }

  async getListOfOrdersForDate(dt: Date): Promise<Order[]> {
    try {
      const orders = await this.apiService.get<Order[]>(`Order/getListOfOrdersForDate/${dt.toISOString()}`).toPromise();
      return orders || [];
    } catch (error) {
      console.error('Error getting orders for date:', error);
      return [];
    }
  }

  async addOrder(order: Order): Promise<void> {
    try {
      const addedOrder = await this.apiService.post<Order>('Order', order).toPromise();
      if (addedOrder) {
        this.orders.next([...this.orders.value, addedOrder]);
        console.log('New order added successfully:', addedOrder);
      }
    } catch (error) {
      console.error('Error adding order:', error);
    }
  }

  async updateOrder(order: Order): Promise<void> {
    try {
        const updatedOrder = await this.apiService.put<Order>(`Order`, order).toPromise(); // Adjust the endpoint as needed
        if (updatedOrder) {
            const updatedOrders = this.orders.value.map(o => o.id === order.id ? updatedOrder : o);
            this.orders.next(updatedOrders);
            console.log('Order updated successfully:', updatedOrder);
        }
    } catch (error) {
        console.error('Error updating order:', error);
    }
}


  async getOrder(id: string): Promise<Order | null> {
    try {
      const order = await this.apiService.get<Order>(`Order/${id}`).toPromise();
      return order || null;
    } catch (error) {
      console.error('Error retrieving order:', error);
      return null;
    }
  }
}
