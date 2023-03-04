import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, map, Observable, Subject } from 'rxjs';
import { ProductCategory } from 'app/entities/product_catagory';
// import { ProductCategory } from 'app/entities/product_catagory';

@Injectable({
  providedIn: 'root'
})
export class CatagoryService {
  ProductCategories = new BehaviorSubject<ProductCategory[]>(new Array<ProductCategory>());  
  
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
        {
          this.ProductCategories.next(productCategories);                    
          console.log("this.ProductCategoryChanged.next");
        });    
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

    return this.http
      .post
      (
        'https://dukanzapitest.azurewebsites.net/api/ProductCategory'
        // "https://localhost:7114/api/ProductCategory"
        , productCategory,
        { responseType: 'text' }
      );
  }

  UpdateCatagory(productCategory: ProductCategory) {
    console.log("Update Catagory Started");

    console.log(JSON.stringify(productCategory));

    return this.http
      .put
      (
        'https://dukanzapitest.azurewebsites.net/api/ProductCategory'
        // "https://localhost:7114/api/ProductCategory"
        ,productCategory,
        { responseType: 'text' }
      );
  }
  
  DeleteCatagory(productCategory: ProductCategory) {       
    console.log("Delete request started");
    console.log(JSON.stringify(productCategory));    
    var options = 
    {
      body: productCategory      
    };

    return this.http
      .delete(
        'https://dukanzapitest.azurewebsites.net/api/ProductCategory',
        // "https://localhost:7114/api/ProductCategory",
        options
      );      
  }
}