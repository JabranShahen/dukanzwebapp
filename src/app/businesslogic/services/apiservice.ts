import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  baseUrl: string = 'https://dukanzapiauth.azurewebsites.net/api/';  
  
  constructor(private http: HttpClient) {}

  get<T>(url: string): Observable<T> {
    console.log("GET request to: " + this.baseUrl + url);
    return this.http.get<T>(this.baseUrl + url);
  }

  post<T>(url: string, data: T): Observable<T> {
    console.log("POST request to: " + this.baseUrl + url, data);
    return this.http.post<T>(this.baseUrl + url, data);
  }

  put<T>(url: string, data: T): Observable<T> {
    console.log("PUT request to: " + this.baseUrl + url, data);
    return this.http.put<T>(this.baseUrl + url, data);
  }

  delete<T>(url: string, id: string): Observable<T> {
    console.log("DELETE request to: " + this.baseUrl + url + "/" + id);
    return this.http.delete<T>(`${this.baseUrl}${url}/${id}`);
  }
}
