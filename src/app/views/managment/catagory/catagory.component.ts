import {
  Component,
  OnInit,
  AfterViewInit,
} from "@angular/core";
import { matxAnimations } from "app/shared/animations/matx-animations";
import { CatagoryService } from "./services/catagory.service";
import { ProductCategory } from "app/entities/product_catagory";
import { BehaviorSubject, Observable, Subscription, map } from 'rxjs';
import { AddCatagoryComponent } from "./add/add-catagory.component";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";

@Component({
  selector: 'app-catagory',
  templateUrl: './catagory.component.html',
  styleUrls: ['./catagory.component.scss'],
  animations: matxAnimations
})
export class CatagoryComponent implements OnInit, AfterViewInit {
  trafficVsSaleOptions: any;
  trafficVsSale: any;
  trafficData: any;
  saleData: any;

  sessionOptions: any;
  sessions: any;
  sessionsData: any;

  trafficGrowthChart: any;
  bounceRateGrowthChart: any;

  dailyTrafficChartBar: any;
  trafficSourcesChart: any;
  countryTrafficStats: any[];
  doughNutPieOptions: any;
  // subscription: Subscription;

  displayedColumns: string[] = ["productCategoryName", "productCategoryImageURL", "visible", "order", "actions"];

  productCategoriesForTable$: Observable<MatTableDataSource<ProductCategory>>;

  objectCount = 0;
  constructor(public catagoryService: CatagoryService, public dialog: MatDialog
    , public productCategoriesData: MatTableDataSource<ProductCategory>) {
    this.productCategoriesForTable$ = this.catagoryService.ProductCategories.asObservable().pipe(
      map((productCategories) => {
        this.productCategoriesData.data = productCategories
        console.log("Data loaded");
        return this.productCategoriesData;
      })
    );

  }

  ngAfterViewInit() { }
  ngOnInit() {

    console.log("Data service called");
    // this.subscription = this.catagoryService.ProductCategoryChanged
    // .subscribe
    // (
    //   (productCategories: ProductCategory[]) => {        
    //     this.catagoryService.ProductCategories.next(productCategories);
    //     console.log("Data returned");        
    //   }            
    // );

    this.catagoryService.getCatagories();
  }

  addNew() {
    const dialogRef = this.dialog.open(AddCatagoryComponent, {
      data: new ProductCategory({ id: '' })
    });

    dialogRef.afterClosed().subscribe(result => {
      this.catagoryService.getCatagories();
    })
  }

  editItem(rowIndex: number, data: any) {
    const dialogRef = this.dialog.open(AddCatagoryComponent, {
      data: data
    });
  
    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        try {
          await this.catagoryService.updateCatagory(result);
          this.catagoryService.getCatagories();
        } catch (error) {
          console.error('Error updating category:', error);
        }
      }
    });
  }
  

  async deleteItem(rowIndex: number, data: any): Promise<void> {
    if (confirm("Are you sure to delete " + data.productCategoryName)) {
      try {
        await this.catagoryService.deleteCatagory(data);
        // Remove the item from the local array
        this.productCategoriesData.data.splice(rowIndex, 1);
        // Notify the MatTableDataSource that the data has changed
        this.productCategoriesData._updateChangeSubscription();
      } catch (error) {
        console.error("Error deleting category:", error);
        // Handle error if necessary
      }
    }
  }


}