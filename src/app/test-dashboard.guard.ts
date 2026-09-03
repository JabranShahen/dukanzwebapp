import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of, switchMap, take, filter, map } from 'rxjs';

import { AuthService } from './auth.service';
import { ENABLE_TEST_DASHBOARD } from './services/time.service';

/** Guards the /dashboard/test-dashboard route. Requires ENABLE_TEST_DASHBOARD flag
 *  and TestAdmin (superadmin) role. Returns to /dashboard when disabled. */
@Injectable({ providedIn: 'root' })
export class TestDashboardGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    if (!ENABLE_TEST_DASHBOARD) {
      return of(this.router.createUrlTree(['/dashboard']));
    }

    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        if (!user) {
          return of(this.router.createUrlTree(['/login']));
        }
        return this.authService.profileReady$.pipe(
          filter(Boolean),
          take(1),
          map(() =>
            this.authService.currentRole === 'superadmin'
              ? true
              : this.router.createUrlTree(['/dashboard'])
          )
        );
      })
    );
  }
}
