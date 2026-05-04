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
import { AreaManagementComponent } from './areas/area-management.component';
import { CustomerAllocationComponent } from './allocation/customer-allocation.component';
import { DriverOrdersComponent } from './driver/driver-orders.component';
import { MonitoringDashboardComponent } from './monitoring/monitoring-dashboard.component';
import { PurchaseManagementComponent } from './purchase/purchase-management.component';
import { PackingReportComponent } from './packing/packing-report.component';
import { CustomerManagementComponent } from './customers/customer-management.component';
import { StaffManagementComponent } from './staff/staff-management.component';
import { LoginComponent } from './login/login.component';
import { OrderManagementComponent } from './orders/order-management.component';
import { OperationalDayDashboardComponent } from './operational-day/operational-day-dashboard.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
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
        component: DashboardOverviewComponent
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
        path: 'allocation',
        component: CustomerAllocationComponent
      },
      {
        path: 'areas',
        component: AreaManagementComponent
      },
      {
        path: 'monitoring',
        component: MonitoringDashboardComponent
      },
      {
        path: 'operational-day',
        component: OperationalDayDashboardComponent
      },
      {
        path: 'purchase',
        component: PurchaseManagementComponent
      },
      {
        path: 'purchase-process',
        redirectTo: 'purchase',
        pathMatch: 'full'
      },
      {
        path: 'packing',
        component: PackingReportComponent
      },
      {
        path: 'settings',
        component: SettingsComponent
      },
      {
        path: 'users',
        redirectTo: 'customers',
        pathMatch: 'full'
      },
      {
        path: 'customers',
        component: CustomerManagementComponent
      },
      {
        path: 'staff',
        component: StaffManagementComponent
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
