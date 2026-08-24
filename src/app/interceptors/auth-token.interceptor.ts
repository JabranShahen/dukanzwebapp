import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { AuthService } from '../services/auth-service';
import { environment } from '../../environments/environment';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const apiRoots = [environment.api.baseUrl, ...(environment.api.fallbackBaseUrls ?? [])]
    .map((url) => url.replace(/\/$/, ''))
    .filter((url, index, urls) => Boolean(url) && urls.indexOf(url) === index);

  if (!apiRoots.some((apiRoot) => req.url.startsWith(apiRoot))) {
    return next(req);
  }

  return from(authService.getFreshToken()).pipe(
    switchMap((token) => {
      if (!token) {
        return next(req);
      }

      return next(
        req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );
    }),
  );
};
