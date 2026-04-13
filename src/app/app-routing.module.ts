import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './auth.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DashboardOverviewComponent } from './dashboard/dashboard-overview/dashboard-overview.component';
import { CategoryManagementComponent } from './category-management/category-management.component';
import { EventCompositionComponent } from './events/event-composition.component';
import { EventCategoryManagementComponent } from './events/event-category-management.component';
import { ProductManagementComponent } from './products/product-management.component';
import { SettingsComponent } from './settings/settings.component';
import { AccountComponent } from './account/account.component';
import { DriverOrdersComponent } from './driver/driver-orders.component';
import { PurchaseCreateComponent } from './purchase/purchase-create.component';
import { PurchaseProcessComponent } from './purchase/purchase-process.component';
import { UserManagementComponent } from './users/user-management.component';
import { LoginComponent } from './login/login.component';
import { OrderManagementComponent } from './orders/order-management.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard/categories',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      {
        path: '',
        component: DashboardOverviewComponent,
        pathMatch: 'full'
      },
      {
        path: 'categories',
        component: CategoryManagementComponent
      },
      {
        path: 'event-composition',
        redirectTo: 'events',
        pathMatch: 'full'
      },
      {
        path: 'events/manage',
        redirectTo: 'events',
        pathMatch: 'full'
      },
      {
        path: 'events',
        component: EventCompositionComponent
      },
      {
        path: 'events/:eventId/categories',
        component: EventCategoryManagementComponent
      },
      {
        path: 'products',
        component: ProductManagementComponent
      },
      {
        path: 'driver',
        component: DriverOrdersComponent
      },
      {
        path: 'orders',
        component: OrderManagementComponent
      },
      {
        path: 'purchase',
        component: PurchaseCreateComponent
      },
      {
        path: 'purchase-process',
        component: PurchaseProcessComponent
      },
      {
        path: 'settings',
        component: SettingsComponent
      },
      {
        path: 'users',
        component: UserManagementComponent
      },
      {
        path: 'account',
        component: AccountComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
