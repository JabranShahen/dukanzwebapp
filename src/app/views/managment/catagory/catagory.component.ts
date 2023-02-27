import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ElementRef, ViewChild
} from "@angular/core";
import { matxAnimations } from "app/shared/animations/matx-animations";
import { ThemeService } from "app/shared/services/theme.service";
import tinyColor from "tinycolor2";
import PerfectScrollbar from "perfect-scrollbar";
import { CatagoryService } from "./services/catagory.service";
import { Console } from "console";
import { ProductCategory } from "app/entities/product_catagory";
import { Subscription } from 'rxjs';
import { AddCatagoryComponent } from "./add/add-catagory.component";
import { MatDialog } from "@angular/material/dialog";

import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';



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
  productCategories :ProductCategory[];
  subscription: Subscription;

  // productCategoryName: string;
  // productCategoryImageURL: string;
  // visible: boolean;
  // order: number;
  
  displayedColumns: string[] = ["productCategoryName", "productCategoryImageURL", "visible", "order", "actions"];
  
  constructor(public catagoryService: CatagoryService, public dialog: MatDialog,) 
  {
  }

  ngAfterViewInit() {}
  ngOnInit() 
  {
    this.subscription = this.catagoryService.ProductCategoryChanged
    .subscribe
    (
      (productCategories: ProductCategory[]) => {
        this.productCategories = productCategories;
      }
    );
    this.productCategories = this.catagoryService.getCatagories();
  }

  addNew() {
    const dialogRef = this.dialog.open(AddCatagoryComponent, {
      data: new ProductCategory() 
    });

    dialogRef.afterClosed().subscribe(result => {
      // if (result === 1) {
      //   // After dialog is closed we're doing frontend updates
      //   // For add we're just pushing a new row inside DataService
      //   this.exampleDatabase.dataChange.value.push(this.dataService.getDialogData());
      //   this.refreshTable();
      })
    }
  }