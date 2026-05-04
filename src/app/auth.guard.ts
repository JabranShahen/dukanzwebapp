import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { filter, map, Observable, of, switchMap, take } from 'rxjs';

import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  private readonly superAdminRoutes = [
    '/dashboard/areas',
    '/dashboard/users',
    '/dashboard/products',
    '/dashboard/categories',
    '/dashboard/events',
    '/dashboard/monitoring',
    '/dashboard/settings'
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        if (!user) {
          return of(this.router.createUrlTree(['/login']));
        }

        return this.authService.profileReady$.pipe(
          filter(Boolean),
          take(1),
          map(() => this.canOpen(state.url))
        );
      })
    );
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.canActivate(route, state);
  }

  private canOpen(url: string): boolean | UrlTree {
    const requiresSuperAdmin = this.superAdminRoutes.some((route) => url.startsWith(route));
    if (!requiresSuperAdmin || this.authService.currentRole === 'superadmin') {
      return true;
    }

    return this.router.createUrlTree(['/dashboard']);
  }
}
