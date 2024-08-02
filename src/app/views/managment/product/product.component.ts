import { Component, OnInit, AfterViewInit } from "@angular/core";
import { matxAnimations } from "app/shared/animations/matx-animations";
import { ProductService } from "./services/product.service";
import { Product } from "app/entities/product";
import { BehaviorSubject, Observable, map } from 'rxjs';
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { AddProductComponent } from "./add-product/add-product.component"; // Import the AddProductComponent
import { ProductCategory } from "app/entities/product_catagory";
import { CategoryService } from "../catagory/services/product_category";


@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
  animations: matxAnimations
})
export class ProductComponent implements OnInit, AfterViewInit {

  productCategories: ProductCategory[] = [];
  selectedCategory: string = '';
  showAddProduct: boolean = false;
  displayedColumns: string[] = [
    "productName",
    "productDescription",
    "orignalPrice",
    "currentPrice",
    "currentCost",
    "unitName",
    "displayPercentage",
    "displayUnitName",
    "imageURL",
    "visible",
    "order",
    "actions" // Changed from "actions" to "action"
  ];
  productsDataSource$: Observable<MatTableDataSource<Product>>;

  constructor(
    public productService: ProductService,
    public dialog: MatDialog,
    private categoryService: CategoryService
  ) {}

  ngAfterViewInit() {}

  ngOnInit() {
    this.loadProductCategories();
    this.loadProducts();
  }

  loadProductCategories(): void {
    this.categoryService.getCategories().subscribe(
      (categories: ProductCategory[]) => {
        this.productCategories = categories;
      },
      (error: any) => {
        console.error('Error fetching product categories:', error);
      }
    );
  }

  loadProducts(): void {
    this.productService.loadProducts().then(() => {
      this.filterProducts();
    });
  }

  filterProducts(): void {
    this.productsDataSource$ = this.productService.getProducts().pipe(
      map(products => {
        if (this.selectedCategory) {
          products = products.filter(product => product.productCategoryId === this.selectedCategory);
        }
        return new MatTableDataSource<Product>(products);
      })
    );
  }

  onSelectCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.filterProducts();
    console.log('Selected category:', this.selectedCategory);
  }

  showAddProductForm() {
    this.showAddProduct = true;
  }

  addNew() {
    const dialogRef = this.dialog.open(AddProductComponent, {
      data: {
        mode: 'New', // Pass the mode as 'New'
        categories: this.productCategories
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Reload products data after adding
      if (result) {
        this.productService.loadProducts();
      }
    });
  }

  editItem(row: any) {
    const dialogRef = this.dialog.open(AddProductComponent, {
      data: {
        mode: 'Existing', // Pass the mode as 'Existing'
        selectedProduct: row, // Pass the selected product
        categories: this.productCategories
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        try {
          await this.productService.updateProduct(result);
          this.productService.loadProducts(); // Reload products after editing
        } catch (error) {
          console.error('Error updating product:', error);
        }
      }
    });
  }

  async deleteItem(rowIndex: number, data: Product): Promise<void> {
    if (confirm("Are you sure to delete " + data.productName)) {
      try {
        await this.productService.deleteProduct(data);
        // Remove the item from the local array
        const productsDataSource = (await this.productsDataSource$.toPromise()).data;
        productsDataSource.splice(rowIndex, 1);
        // Notify the MatTableDataSource that the data has changed
        this.productsDataSource$ = new BehaviorSubject(new MatTableDataSource(productsDataSource));
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  }
}
