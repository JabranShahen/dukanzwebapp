import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor implements HttpInterceptor {

  constructor(private afAuth: AngularFireAuth) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('HTTP Request intercepted:', req.url); // Log the request URL or any other details you need

    return from(this.afAuth.idToken).pipe(
      switchMap(token => {
        if (token) {
          // Clone the request and set the new header with the token
          const authReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
          console.log('Token added to request:', authReq.url);
          return next.handle(authReq);
        }
        // If no token is available, just pass the original request
        return next.handle(req);
      })
    );
  }
}
