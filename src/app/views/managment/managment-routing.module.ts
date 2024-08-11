import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CatagoryComponent } from './catagory/catagory.component';
import { ProductComponent } from './product/product.component';
import { DriverComponent } from './driver/driver/driver.component';

export const ManagmentRoutes: Routes = [
  {
    path: '',
    children: [
      
      {
        path: 'catagory',
        component: CatagoryComponent,
        data: { title: 'Catagory', breadcrumb: 'Catagory' }      
      },

      {
        path: 'product',
        component: ProductComponent,
        data: { title: 'Product', breadcrumb: 'Product' }      
      },    
      {
        path: 'driver',
        component: DriverComponent,
        data: { title: 'Driver', breadcrumb: 'Driver' }      
      }

    ]
  }
];
