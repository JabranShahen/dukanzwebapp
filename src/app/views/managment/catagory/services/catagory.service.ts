import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, Subject } from 'rxjs';
import { ProductCategory } from 'app/entities/product_catagory';
// import { ProductCategory } from 'app/entities/product_catagory';

@Injectable({
  providedIn: 'root'
})
export class CatagoryService {
  ProductCategoryChanged = new Subject<ProductCategory[]>();
  private productCategories: ProductCategory[] = [];
  constructor(
    private http: HttpClient
  ) { }

  getCatagories() {
    this.http
      .get<ProductCategory[]>(
        'https://dukanzapitest.azurewebsites.net/api/ProductCategory'
        // 'https://localhost:7114/api/ProductCategory'
      )
      .subscribe(productCategories =>
        this.setCatagories(productCategories));
    return this.productCategories;
  }

  setCatagories(productCategories: ProductCategory[]) {
    this.productCategories = productCategories;
    this.ProductCategoryChanged.next(this.productCategories);
  }

  newGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  saveNewCatagory(productCategory: ProductCategory) {
    console.log("saveNewCatagory Started");
    productCategory.id = this.newGuid();
    productCategory.partitionKey = productCategory.id;

    console.log(JSON.stringify(productCategory));

    this.http
      .post
      (
        'https://dukanzapitest.azurewebsites.net/api/ProductCategory'
        // "https://localhost:7114/api/ProductCategory"
        , productCategory

      ).subscribe(
        data => {
          this.productCategories.push(productCategory);
          this.ProductCategoryChanged.next(this.productCategories);
          console.log("saveNewCatagory Completed");
        });
  }
}