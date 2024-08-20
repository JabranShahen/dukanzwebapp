import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './apiservice';
import { ProductCategory } from '../entities/product_catagory';


@Injectable({
  providedIn: 'root'
})
export class CategoryService implements OnDestroy {
  private productCategories = new BehaviorSubject<ProductCategory[]>([]);
  private timer: any; // Timer variable

  constructor(private apiService: ApiService) {
    // Start the timer when the service is instantiated
    this.startTimer();
    this.loadCategories(); // Load categories initially
  }

  getCategories(): Observable<ProductCategory[]> {
    return this.productCategories.asObservable();
  }

  private loadCategories(): void {
    this.apiService.get<ProductCategory[]>('ProductCategory').subscribe(
      productCategories => {
        this.productCategories.next(productCategories);
        console.log('Product categories updated. Count:', productCategories.length);
      },
      error => {
        console.error('Error getting product categories:', error);
      }
    );
  }

  newGuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  async saveNewCategory(productCategory: ProductCategory): Promise<void> {
    try {
      productCategory.id = this.newGuid();
      productCategory.partitionKey = productCategory.id;

      await this.apiService.post<ProductCategory>('ProductCategory', productCategory).toPromise();
      console.log('New category saved successfully.');
      this.loadCategories(); // Reload categories after adding a new one
    } catch (error) {
      console.error('Error saving category:', error);
    }
  }

  async updateCategory(productCategory: ProductCategory): Promise<void> {
    try {
      await this.apiService.put<ProductCategory>(`ProductCategory`, productCategory).toPromise();
      console.log('Category updated successfully.');
      this.loadCategories(); // Reload categories after updating
    } catch (error) {
      console.error('Error updating category:', error);
    }
  }

  async deleteCategory(productCategory: ProductCategory): Promise<void> {
    try {
      await this.apiService.delete<ProductCategory>('ProductCategory', productCategory.id).toPromise();
      console.log('Category deleted successfully.');
      this.loadCategories(); // Reload categories after deletion
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  }

  private startTimer(): void {
    this.timer = setInterval(() => {
      console.log('Count of product categories:', this.productCategories.value.length);
    }, 5000); // Log count every 5 seconds
  }

  private stopTimer(): void {
    clearInterval(this.timer);
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
