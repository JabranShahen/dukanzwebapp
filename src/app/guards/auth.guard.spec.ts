import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth-service';

describe('authGuard', () => {
  let token: string | null;

  beforeEach(() => {
    token = null;

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            getToken: () => token,
          },
        },
      ],
    });
  });

  it('allows navigation when a token exists', () => {
    token = 'live-token';

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/dashboard/products' } as never));

    expect(result).toBe(true);
  });

  it('redirects unauthenticated users to sign-in with a returnUrl', () => {
    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/dashboard/products' } as never));

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/sign-in?returnUrl=%2Fdashboard%2Fproducts');
  });
});
