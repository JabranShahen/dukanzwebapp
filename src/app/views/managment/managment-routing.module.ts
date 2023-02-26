import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CatagoryComponent } from './catagory/catagory.component';

export const ManagmentRoutes: Routes = [
  {
    path: '',
    children: [{
      path: 'catagory',
      component: CatagoryComponent,
      data: { title: 'Catagory', breadcrumb: 'Catagory' }
    }]
  }
];

