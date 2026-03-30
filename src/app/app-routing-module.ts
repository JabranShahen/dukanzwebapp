import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';
import { AccountPlaceholderComponent } from './account-placeholder/account-placeholder.component';
import { CategoryManagementComponent } from './category-management/category-management.component';
import { DashboardOverviewComponent } from './dashboard/dashboard-overview.component';
import { DashboardShellComponent } from './dashboard/dashboard-shell.component';
import { LandingPageComponent } from './landing/landing-page.component';
import { LoginPageComponent } from './login/login-page.component';
import { PrivacyPageComponent } from './privacy/privacy-page.component';
import { ProductManagementComponent } from './product-management/product-management.component';
import { SettingsPageComponent } from './settings/settings-page.component';
import { SignInPageComponent } from './sign-in/sign-in-page.component';
import { UiReferenceComponent } from './ui-reference/ui-reference.component';

const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent,
    title: 'Dukanz | Operations, rebuilt with intention',
  },
  {
    path: 'privacy',
    component: PrivacyPageComponent,
    title: 'Dukanz | Privacy',
  },
  {
    path: 'login',
    component: LoginPageComponent,
    title: 'Dukanz | Login',
  },
  {
    path: 'sign-in',
    component: SignInPageComponent,
    title: 'Dukanz | Sign In',
  },
  {
    path: 'dashboard',
    component: DashboardShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: DashboardOverviewComponent,
        pathMatch: 'full',
        title: 'Dukanz | Dashboard',
      },
      {
        path: 'categories',
        component: CategoryManagementComponent,
        title: 'Dukanz | Category Management',
      },
      {
        path: 'products',
        component: ProductManagementComponent,
        title: 'Dukanz | Product Management',
      },
      {
        path: 'settings',
        component: SettingsPageComponent,
        data: {
          pageTitle: 'Platform settings',
          pageBody:
            'DukanzConfig is wired into the new shell here so account, brand, and storefront settings can move without dragging legacy template concerns with them.',
        },
        title: 'Dukanz | Settings',
      },
      {
        path: 'account',
        component: AccountPlaceholderComponent,
        title: 'Dukanz | Account',
      },
      {
        path: 'ui-reference',
        component: UiReferenceComponent,
        title: 'Dukanz | UI Reference',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
