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
    this.loadProducts();
    return this.products.asObservable();
  }

  private async loadProducts(): Promise<void> {
    this.apiService.get<Product[]>('Product').subscribe(
      products => {
        this.products.next(products);
        console.log('Total number of Products :', products.length);
      },
      error => {
        console.error('Error getting product categories:', error);
      }
    );
  }

  async addProduct(product: Product): Promise<void> {
    try {
      console.log('Attempting to add product:', JSON.stringify(product));

      const addedProduct = await this.apiService.post<Product>('product', product).toPromise();
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
      // Log the product object as JSON before making the update call
      console.log('Updating product:', JSON.stringify(product, null, 2));
  
      const updatedProduct = await this.apiService.put<Product>(`product/${product.id}`, product).toPromise();
      if (updatedProduct) {
        const updatedProducts = this.products.value.map(p => p.id === product.id ? updatedProduct : p);
        this.products.next(updatedProducts);
        console.log('Product updated successfully:', JSON.stringify(updatedProduct, null, 2));
      }
    } catch (error) {
      console.error("Error updating product:", error);
    }
  }
  

  async deleteProduct(product: Product): Promise<void> {
    try {
      await this.apiService.delete(`product`, product.id).toPromise();  // Pass both the URL and the ID
      const updatedProducts = this.products.value.filter(p => p.id !== product.id);
      this.products.next(updatedProducts);
      console.log('Product deleted successfully.');
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  }
}
