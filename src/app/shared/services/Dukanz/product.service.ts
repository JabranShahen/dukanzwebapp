import { Injectable } from '@angular/core';
import { Product } from 'app/entities/product';
import { BehaviorSubject, Observable } from 'rxjs';
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

  async loadProducts(): Promise<void> {
    try {
      const products = await this.apiService.get<Product[]>('product').toPromise(); // Corrected endpoint
      this.products.next(products);
      console.log("Products updated.");
      console.log("Products count. " + products.length.toString());
    } catch (error) {
      console.error("Error getting products:", error);
    }
  }

  async addProduct(product: Product): Promise<void> {
    try {
      // Log the product object as a JSON string
      console.log('Attempting to add product:', JSON.stringify(product));
  
      await this.apiService.post('product', product).toPromise();      
      this.products.next([...this.products.value, product]);
      console.log('New product added successfully:', JSON.stringify(product));
    } catch (error) {
      console.error("Error adding product:", error);
    }
  }
  
    
  async updateProduct(product: Product): Promise<void> {
    try {
      await this.apiService.put<Product>('product', product).toPromise(); // Corrected endpoint
      console.log('Product updated successfully.');
    } catch (error) {
      console.error("Error updating product:", error);
    }
  }

  async deleteProduct(product: Product): Promise<void> {
    try {
      await this.apiService.delete<Product>(`product`, product).toPromise(); // Corrected endpoint
      const updatedProducts = this.products.value.filter(p => p.id !== product.id);
      this.products.next(updatedProducts);
      console.log('Product deleted successfully.');
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  }
}
