import { Component, OnInit } from '@angular/core';
import { Product } from '../businesslogic/entities/product';
import { ProductCategory } from '../businesslogic/entities/product_catagory';
import { ProductService } from '../businesslogic/services/product.service';
import { CategoryService } from '../businesslogic/services/product_category';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss']
})
export class ProductComponent implements OnInit {
  productCategories: ProductCategory[] = [];
  products: Product[] = [];
  filteredProducts: Product[] = [];
  selectedCategory?: ProductCategory;
  selectedProduct?: Product;
  productToDelete?: Product; // Temporary holder for the product to be deleted

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe(
      (categories: ProductCategory[]) => {
        this.productCategories = categories;
      },
      (error: any) => {
        console.error('Failed to load product categories:', error);
      }
    );
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe(
      (products: Product[]) => {
        this.products = products;
        this.filterProducts();
      },
      (error: any) => {
        console.error('Failed to load products:', error);
      }
    );
  }

  filterProducts(): void {
    this.filteredProducts = this.selectedCategory 
      ? this.products.filter(product => product.productCategoryId === this.selectedCategory?.id)
      : this.products;
  }

  onSelectCategory(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const categoryId = selectElement.value;
    this.selectedCategory = this.productCategories.find(category => category.id === categoryId);
    this.filterProducts();
    console.log('Selected category:', this.selectedCategory?.productCategoryName || 'All');
  }

  editProduct(product: Product): void {
    this.selectedProduct = product; // Set the selected product for editing
  }

  saveProduct(): void {
    if (this.selectedProduct) {
      // If the product has an ID, update it; otherwise, add a new product
      if (this.selectedProduct.id) {
        this.productService.updateProduct(this.selectedProduct).then(() => {
          this.selectedProduct = undefined; // Clear the selection after saving
          this.loadProducts(); // Reload products after saving
        });
      } else {
        this.productService.addProduct(this.selectedProduct).then(() => {
          this.selectedProduct = undefined; // Clear the selection after saving
          this.loadProducts(); // Reload products after adding
        });
      }
    }
  }

  cancelEdit(): void {
    this.selectedProduct = undefined; // Clear the selection without saving
  }

  addNewProduct(): void {
    this.selectedProduct = new Product(
      '', // id
      '', // productName
      '', // productDescription
      0, // orignalPrice
      0, // currentPrice
      0, // currentCost
      '', // unitName
      0, // displayPercentage
      '', // displayUnitName
      '', // imageURL
      true, // visible
      0, // order
      '', // productCategoryId
      ''  // partitionKey
    ); // Create a new empty product for adding
  }

  confirmDeleteProduct(product: Product): void {
    this.productToDelete = product; // Hold the product to be deleted temporarily
  }

  deleteConfirmed(): void {
    if (this.productToDelete) {
      this.productService.deleteProduct(this.productToDelete).then(() => {
        this.loadProducts(); // Reload products after deletion
        this.productToDelete = undefined; // Clear the temporary holder
      }).catch(error => {
        console.error('Failed to delete product:', error);
      });
    }
  }
}
