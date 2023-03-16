import { catchError, Observable, of, tap, throwError } from "rxjs";
import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Router } from "@angular/router";

export interface AuthResponseData 
{
    kind: string;
    idToken: string;
    email: string;
    refreshToken: string;
    expiresIn: string;
    localId: string;
    registered?: boolean;
}

@Injectable({providedIn: 'root'})
export class DukanzAuthService
{

    public idToken: string = "";

    constructor
    (
        private http: HttpClient
    )
    {
    }
    
    createUser(email:string, password: string)
    {
      console.log("email:"+email +" - "+ "password:" +password);
        return this.http
        .post<AuthResponseData>(
          'https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=AIzaSyC1FnOpxbyZLUVZDbod6CxNnfvfTCb4MtY',
          {
            email: email,
            password: password,
            returnSecureToken: true
          }
        )
        .pipe(
          catchError(this.handleError),
          tap(resData => {
            console.log("Create User completed");
            this.handleAuthentication(              
              resData.localId            
            );
          })
        );
    }

    signInUser(email:string, password: string)
    {
      console.log("email:"+email +" - "+ "password:" +password);
        return this.http
        .post<AuthResponseData>(
          'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyC1FnOpxbyZLUVZDbod6CxNnfvfTCb4MtY',
          {
            email: email,
            password: password,
            returnSecureToken: true
          }
        )
        .pipe(
          catchError(this.handleError),
          tap(resData => {
            console.log("User logged in");
            this.handleAuthentication(              
              resData.idToken
            );
          })
        );
    }

    handleAuthentication(idToken: string) 
    {      
      console.log(idToken);
      this.idToken = idToken;      
    }

    private handleError(errorRes: HttpErrorResponse) {
      let errorMessage = 'An unknown error occurred!';
      console.log(errorRes.error.error.message);
      if (!errorRes.error || !errorRes.error.error) {
        return throwError(errorMessage);
      }
      switch (errorRes.error.error.message) {
        case 'EMAIL_EXISTS':
          errorMessage = 'This email exists already';
          break;
        case 'EMAIL_NOT_FOUND':
          errorMessage = 'This email does not exist.';
          break;
        case 'INVALID_PASSWORD':
          errorMessage = 'This password is not correct.';
          break;
      }
      return throwError(errorMessage);
    }

}