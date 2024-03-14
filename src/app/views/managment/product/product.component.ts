import { Component, OnInit, AfterViewInit } from "@angular/core";
import { matxAnimations } from "app/shared/animations/matx-animations";
import { ProductService } from "./services/product.service";
import { Product } from "app/entities/product";
import { BehaviorSubject, Observable, map } from 'rxjs';
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";

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
    // Implement the addNew functionality here
  }

  editItem(rowIndex: number, data: any) {
    // Implement the editItem functionality here
  }

  async deleteItem(rowIndex: number, data: any): Promise<void> {
    if (confirm("Are you sure to delete " + data.productName)) {
      try {
        await this.productService.deleteProduct(data);
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  }
}
