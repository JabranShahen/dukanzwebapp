import { Component, OnInit, AfterViewInit } from "@angular/core";
import { matxAnimations } from "app/shared/animations/matx-animations";
import { ProductService } from "./services/product.service";
import { Product } from "app/entities/product";
import { BehaviorSubject, Observable, map } from 'rxjs';
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { AddProductComponent } from "./add-product/add-product.component"; // Import the AddProductComponent

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
  animations: matxAnimations
})
export class ProductComponent implements OnInit, AfterViewInit {
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
    "action" // Changed from "actions" to "action"
  ];
  
  productsDataSource$: Observable<MatTableDataSource<Product>>;

  constructor(public productService: ProductService, public dialog: MatDialog) {}

  ngAfterViewInit() { }
  
  ngOnInit() {
    this.productService.loadProducts().then(() => {
      this.productsDataSource$ = this.productService.getProducts().pipe(
        map(products => {
          const dataSource = new MatTableDataSource<Product>(products);
          return dataSource;
        })
      );
    });
  }
  
  addNew() {
    const dialogRef = this.dialog.open(AddProductComponent, {
      data: new Product(
        '', // id (empty string for a new product)
        '', // productName
        0, // orignalPrice
        0, // currentPrice
        0, // currentCost
        '', // unitName
        0, // displayPercentage
        '', // imageURL
        true, // visible
        0, // order
        '' // productCategoryId (optional, provide value if necessary)
      )
    });
  
    dialogRef.afterClosed().subscribe(result => {
      // Reload products data after adding
      if (result) {
        this.productService.loadProducts();
      }
    });
  }
  

  // editItem(rowIndex: number, data: Product) {
  //   console.log("data " + data.id.toString());
  //   const dialogRef = this.dialog.open(AddProductComponent, {
  //     data: data // Pass the selected product data for editing
  //   });
      
    
  //   dialogRef.afterClosed().subscribe(result => {
  //     // Reload products data after editing
  //     if (result) {
  //       this.productService.loadProducts();
  //     }
  //   });
  // }

  editItem(row: any) {
    console.log("data " + row.id.toString());

    const dialogRef = this.dialog.open(AddProductComponent, {
      data: row
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
        // Reload products data after deletion
        this.productService.loadProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  }
}
