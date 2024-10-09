import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProductCategoryComponent } from './product-category/product-category.component';
import { ProductComponent } from './product/product.component';
import { OrderComponent } from './order/order.component';  // Import the OrderComponent
import { AuthGuard } from './auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'product-categories', component: ProductCategoryComponent },
      { path: 'product', component: ProductComponent },
      { path: 'order-management', component: OrderComponent }, // Adding OrderComponent to routes
      { path: '', redirectTo: 'product-categories', pathMatch: 'full' } // Default child route
    ]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }  // Wildcard route for handling undefined routes
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
