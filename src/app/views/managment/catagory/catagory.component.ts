import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectionStrategy
} from "@angular/core";
import { matxAnimations } from "app/shared/animations/matx-animations";
import { ThemeService } from "app/shared/services/theme.service";
import tinyColor from "tinycolor2";
import PerfectScrollbar from "perfect-scrollbar";
import { CatagoryService } from "./services/catagory.service";
import { Console } from "console";
import { ProductCategory } from "app/entities/product_catagory";
import { Subscription } from 'rxjs';

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

  // displayedColumns: string[] = ["name", "price", "available", "action"];
  displayedColumns: string[] = ["productCategoryName", "productCategoryImageURL", "visible", "order"];
  
  constructor(public catagoryService: CatagoryService) 
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

}
