import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DashboardOverviewComponent } from './dashboard/dashboard-overview/dashboard-overview.component';
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
import { AccountComponent } from './account/account.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ManagementHeaderComponent } from './shared/management-header/management-header.component';
import { ManagementPanelComponent } from './shared/management-panel/management-panel.component';
import { UiButtonComponent } from './shared/ui/ui-button/ui-button.component';
import { ConfirmDialogComponent } from './shared/ui/confirm-dialog/confirm-dialog.component';
import { UiEmptyStateComponent } from './shared/ui/ui-empty-state/ui-empty-state.component';
import { UiStatusPillComponent } from './shared/ui/ui-status-pill/ui-status-pill.component';
import { UiSnackbarComponent } from './shared/ui/ui-snackbar/ui-snackbar.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    DashboardOverviewComponent,
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
    AccountComponent,
    ManagementHeaderComponent,
    ManagementPanelComponent,
    UiButtonComponent,
    ConfirmDialogComponent,
    UiEmptyStateComponent,
    UiStatusPillComponent,
    UiSnackbarComponent
  ],
  imports: [
    BrowserModule,
    DragDropModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
