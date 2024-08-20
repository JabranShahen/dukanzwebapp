import { Component, OnInit } from '@angular/core';
import { ProductCategory } from '../businesslogic/entities/product_catagory';
import { CategoryService } from '../businesslogic/services/product_category';

@Component({
  selector: 'app-product-category',
  templateUrl: './product-category.component.html',
  styleUrls: ['./product-category.component.scss']
})
export class ProductCategoryComponent implements OnInit {
  productCategories: ProductCategory[] = [];
  selectedCategory?: ProductCategory;

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe(
      (categories) => {
        this.productCategories = categories;
      },
      (error) => {
        console.error('Failed to load product categories:', error);
      }
    );
  }

  editCategory(category: ProductCategory): void {
    this.selectedCategory = category ; // Clone the category to avoid directly editing the list
  }

  saveCategory(): void {
    if (this.selectedCategory) {
      this.categoryService.updateCategory(this.selectedCategory).then(() => {
        this.selectedCategory = undefined; // Clear the selection after saving
      });
    }
  }

  cancelEdit(): void {
    this.selectedCategory = undefined; // Clear the selection without saving
  }
}
