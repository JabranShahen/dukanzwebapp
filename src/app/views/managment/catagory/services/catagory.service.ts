import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProductCategory } from 'app/entities/product_catagory';
import { ApiService } from './apiservice';

@Injectable({
  providedIn: 'root'
})
export class CatagoryService {
  ProductCategories = new BehaviorSubject<ProductCategory[]>([]);

  constructor(private apiService: ApiService) {}

  async getCatagories(): Promise<void> {
    try {
      const productCategories = await this.apiService.get<ProductCategory[]>('ProductCategory').toPromise();
      this.ProductCategories.next(productCategories);
      console.log("this.ProductCategoryChanged.next");
    } catch (error) {
      console.error("Error getting categories:", error);
    }
  }

  newGuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async saveNewCatagory(productCategory: ProductCategory): Promise<void> {
    try {
      productCategory.id = this.newGuid();
      productCategory.partitionKey = productCategory.id;

      await this.apiService.post<any>('ProductCategory', productCategory).toPromise();
      console.log('New category saved successfully.');
    } catch (error) {
      console.error("Error saving category:", error);
    }
  }

  async updateCatagory(productCategory: ProductCategory): Promise<void> {
    try {
      await this.apiService.put<any>('ProductCategory', productCategory).toPromise();
      console.log('Category updated successfully.');
    } catch (error) {
      console.error("Error updating category:", error);
    }
  }

  async deleteCatagory(productCategory: ProductCategory): Promise<void> {
    try {
      await this.apiService.delete<any>('ProductCategory', productCategory).toPromise();
      console.log('Category deleted successfully.');
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  }
}
