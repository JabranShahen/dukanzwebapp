import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  
  // baseUrl: string = 'dukanzapidev.azurewebsites.net/api/';
  baseUrl: string = 'https://dukanzapi.azurewebsites.net/api/';
  // baseUrl: string = 'https://localhost:7114/api/';

  constructor(private http: HttpClient) {}

  get<T>(url: string): Observable<T> {
    return this.http.get<T>(this.baseUrl + url);
  }

  post(url: string, data: any): Observable<string> {
    return this.http.post(this.baseUrl + url, data, { responseType: 'text' });
  }  

  put<T>(url: string, data: any): Observable<string> {
    return this.http.put(this.baseUrl + url, data, { responseType: 'text' });
  }

  delete<T>(url: string, data: any): Observable<T> {
    return this.http.delete<T>(this.baseUrl + url, { body: data });
  }
}
