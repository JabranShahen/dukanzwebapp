import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { from, Observable, switchMap, take } from 'rxjs';

import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private readonly authService: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        if (!user) {
          return next.handle(req);
        }

        return from(user.getIdToken()).pipe(
          switchMap((token) => {
            if (!token) {
              return next.handle(req);
            }

            const authReq = req.clone({
              setHeaders: { Authorization: `Bearer ${token}` }
            });
            return next.handle(authReq);
          })
        );
      })
    );
  }
}
