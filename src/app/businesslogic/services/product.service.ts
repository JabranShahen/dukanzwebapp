import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { Product } from '../entities/product';
import { ApiService } from './apiservice';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products: BehaviorSubject<Product[]> = new BehaviorSubject<Product[]>([]);

  constructor(private apiService: ApiService) {
    this.loadProducts();
  }

  getProducts(): Observable<Product[]> {
    return this.products.asObservable();
  }

  private async loadProducts(): Promise<void> {
    try {
      const products = await this.apiService.get<Product[]>('products').toPromise();
      this.products.next(products || []); // Handle the case where products might be undefined
      console.log("Products updated.");
      console.log("Products count: " + (products?.length?.toString() || '0'));
    } catch (error) {
      console.error("Error getting products:", error);
    }
  }

  async addProduct(product: Product): Promise<void> {
    try {
      console.log('Attempting to add product:', JSON.stringify(product));

      const addedProduct = await this.apiService.post<Product>('products', product).toPromise();
      if (addedProduct) {
        this.products.next([...this.products.value, addedProduct]);
        console.log('New product added successfully:', JSON.stringify(addedProduct));
      }
    } catch (error) {
      console.error("Error adding product:", error);
    }
  }

  async updateProduct(product: Product): Promise<void> {
    try {
      const updatedProduct = await this.apiService.put<Product>(`products/${product.id}`, product).toPromise();
      if (updatedProduct) {
        const updatedProducts = this.products.value.map(p => p.id === product.id ? updatedProduct : p);
        this.products.next(updatedProducts);
        console.log('Product updated successfully.');
      }
    } catch (error) {
      console.error("Error updating product:", error);
    }
  }

  async deleteProduct(product: Product): Promise<void> {
    try {
      await this.apiService.delete(`products`, product.id).toPromise();  // Pass both the URL and the ID
      const updatedProducts = this.products.value.filter(p => p.id !== product.id);
      this.products.next(updatedProducts);
      console.log('Product deleted successfully.');
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  }
}
