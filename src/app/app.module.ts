import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthInterceptor } from './auth.interceptor';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DashboardOverviewComponent } from './dashboard/dashboard-overview/dashboard-overview.component';
import { OrderDetailModalComponent } from './dashboard/dashboard-overview/order-detail-modal/order-detail-modal.component';
import { LoginComponent } from './login/login.component';
import { CategoryManagementComponent } from './category-management/category-management.component';
import { AddCategoryModalComponent } from './category-management/add-category-modal/add-category-modal.component';
import { EditCategoryModalComponent } from './category-management/edit-category-modal/edit-category-modal.component';
import { EventCompositionComponent } from './events/event-composition.component';
import { EventCategoryManagementComponent } from './events/event-category-management.component';
import { EventCategoryModalComponent } from './events/event-category-modal/event-category-modal.component';
import { EventProductModalComponent } from './events/event-product-modal/event-product-modal.component';
import { ProductManagementComponent } from './products/product-management.component';
import { AddProductModalComponent } from './products/add-product-modal/add-product-modal.component';
import { EditProductModalComponent } from './products/edit-product-modal/edit-product-modal.component';
import { AddEventModalComponent } from './events/add-event-modal/add-event-modal.component';
import { EditEventModalComponent } from './events/edit-event-modal/edit-event-modal.component';
import { SettingsComponent } from './settings/settings.component';
import { DriverOrdersComponent } from './driver/driver-orders.component';
import { PackingReportComponent } from './packing/packing-report.component';
import { PurchaseCreateComponent } from './purchase/purchase-create.component';
import { PurchaseProcessComponent } from './purchase/purchase-process.component';
import { AccountComponent } from './account/account.component';
import { UserManagementComponent } from './users/user-management.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgChartsModule } from 'ng2-charts';
import { ManagementHeaderComponent } from './shared/management-header/management-header.component';
import { ManagementPanelComponent } from './shared/management-panel/management-panel.component';
import { UiButtonComponent } from './shared/ui/ui-button/ui-button.component';
import { ConfirmDialogComponent } from './shared/ui/confirm-dialog/confirm-dialog.component';
import { UiEmptyStateComponent } from './shared/ui/ui-empty-state/ui-empty-state.component';
import { UiStatusPillComponent } from './shared/ui/ui-status-pill/ui-status-pill.component';
import { UiSnackbarComponent } from './shared/ui/ui-snackbar/ui-snackbar.component';
import { OrderManagementComponent } from './orders/order-management.component';
import { OrderPanelComponent } from './orders/order-panel/order-panel.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    DashboardOverviewComponent,
    OrderDetailModalComponent,
    LoginComponent,
    CategoryManagementComponent,
    AddCategoryModalComponent,
    EditCategoryModalComponent,
    EventCompositionComponent,
    EventCategoryManagementComponent,
    EventCategoryModalComponent,
    EventProductModalComponent,
    AddEventModalComponent,
    EditEventModalComponent,
    ProductManagementComponent,
    AddProductModalComponent,
    EditProductModalComponent,
    SettingsComponent,
    DriverOrdersComponent,
    PackingReportComponent,
    PurchaseCreateComponent,
    PurchaseProcessComponent,
    AccountComponent,
    UserManagementComponent,
    ManagementHeaderComponent,
    ManagementPanelComponent,
    UiButtonComponent,
    ConfirmDialogComponent,
    UiEmptyStateComponent,
    UiStatusPillComponent,
    UiSnackbarComponent,
    OrderManagementComponent,
    OrderPanelComponent
  ],
  imports: [
    BrowserModule,
    DragDropModule,
    NgChartsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
