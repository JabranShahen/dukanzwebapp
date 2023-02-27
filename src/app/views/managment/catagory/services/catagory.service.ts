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

  getCatagories() 
  {        
    this.http
      .get<ProductCategory[]>(
        'https://dukanzapitest.azurewebsites.net/api/ProductCategory'
      )
      .subscribe(productCategories => 
        this.setCatagories(productCategories));
    // console.log("api call start");
    // this.http.get<any[]>('https://dukanzapinew.azurewebsites.net/api/ProductCategory');
    // // .subscribe(data=>console.log("values"));
    // console.log("api call complete");
    // return productList;
    return this.productCategories;
  }
  
  setCatagories(productCategories: ProductCategory[]) {
    this.productCategories = productCategories;
    this.ProductCategoryChanged.next(this.productCategories);
  }

  //  getCatagories  async() {
  //   // console.log("Got the data");
  //   // return [
  //   //       {
  //   //         imgUrl: "/assets/images/products/headphone-2.jpg",
  //   //         name: "earphone",
  //   //         price: 100,
  //   //         available: 15
  //   //       },
  //   //       {
  //   //         imgUrl: "/assets/images/products/headphone-3.jpg",
  //   //         name: "earphone",
  //   //         price: 1500,
  //   //         available: 30
  //   //       },
  //   //       {
  //   //         imgUrl: "/assets/images/products/iphone-2.jpg",
  //   //         name: "iPhone x",
  //   //         price: 1900,
  //   //         available: 35
  //   //       },
  //   //       {
  //   //         imgUrl: "/assets/images/products/iphone-1.jpg",
  //   //         name: "iPhone x",
  //   //         price: 100,
  //   //         available: 0
  //   //       },
  //   //       {
  //   //         imgUrl: "/assets/images/products/headphone-3.jpg",
  //   //         name: "Head phone",
  //   //         price: 1190,
  //   //         available: 5
  //   //       }
  //   //     ];
  //   try       
  //   {
  //     console.log("getting the data");
  //     await this.http.get<any[]>('https://dukanzapinew.azurewebsites.net/api/ProductCategory')
  //     // var obj= this.http.get<any[]>('https://dukanzapinew.azurewebsites.net/api/ProductCategory')
  //     // .subscribe(data=> console.log("data.length:"+ data.length));      
  //     console.log("Got the data");
  //     console.log(obj);
  //   } catch (error)
  //   {
  //     console.log("Error");
  //   }
  //   return obj;
  // }
}