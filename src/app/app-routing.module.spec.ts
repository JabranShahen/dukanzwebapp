import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';

describe('AppRoutingModule', () => {
  it('routes customers and redirects old users bookmarks', () => {
    TestBed.configureTestingModule({
      imports: [AppRoutingModule]
    });

    const router = TestBed.inject(Router);
    const dashboardRoute = router.config.find((route) => route.path === 'dashboard');
    const children = dashboardRoute?.children ?? [];

    expect(children.some((route) => route.path === 'customers')).toBeTrue();
    expect(children.some((route) => route.path === 'staff')).toBeTrue();
    expect(children.some((route) => route.path === 'data-updates')).toBeTrue();
    expect(children.some((route) => route.path === 'claims')).toBeTrue();
    expect(children).toContain(jasmine.objectContaining({
      path: 'users',
      redirectTo: 'customers',
      pathMatch: 'full'
    }));
  });
});
