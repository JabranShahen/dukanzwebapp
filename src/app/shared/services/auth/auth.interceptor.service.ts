import { Injectable } from "@angular/core";
import { HttpEvent, HttpHandler, HttpInterceptor, HttpParams, HttpRequest } from "@angular/common/http";
import { exhaustMap, Observable, take } from "rxjs";
import { DukanzAuthService } from "./dukanz-auth.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor
{
    constructor(private authService: DukanzAuthService)
    {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> 
    {        
              console.log("Interecepter called");       
              if (this.authService.idToken=="") {
                return next.handle(req);
              }
              const modifiedReq = req.clone({                
                params: new HttpParams().set('auth', this.authService.idToken)                
              });
              console.log("Interecepter set");       
              return next.handle(modifiedReq);            
    }
        
          
        // console.log("Interecepter called");
        // req.params.append        
        // (
        //     'auth', this.authService.idToken
        // );
        // return next.handle(req);        
    
}