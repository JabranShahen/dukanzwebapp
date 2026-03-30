import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrls: string[];

  constructor(private readonly http: HttpClient) {
    const urls = [environment.apiBaseUrl, ...(environment.fallbackApiBaseUrls || [])]
      .map((url) => (url || '').replace(/\/+$/, ''))
      .filter((url, index, all) => !!url && all.indexOf(url) === index);

    this.baseUrls = urls;
  }

  get<T>(endpoint: string): Observable<T> {
    return this.tryGet<T>(endpoint, 0);
  }

  post<T>(endpoint: string, payload: unknown): Observable<T> {
    return this.tryPost<T>(endpoint, payload, 0);
  }

  put<T>(endpoint: string, payload: unknown): Observable<T> {
    return this.tryPut<T>(endpoint, payload, 0);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.tryDelete<T>(endpoint, 0);
  }

  private tryGet<T>(endpoint: string, index: number): Observable<T> {
    if (index >= this.baseUrls.length) {
      return throwError(() => new Error('No API base URL configured.'));
    }

    const url = `${this.baseUrls[index]}/${endpoint.replace(/^\/+/, '')}`;
    return this.http.get<T>(url).pipe(
      catchError((error) => {
        if (index + 1 < this.baseUrls.length) {
          return this.tryGet<T>(endpoint, index + 1);
        }
        return throwError(() => error);
      })
    );
  }

  private tryPost<T>(endpoint: string, payload: unknown, index: number): Observable<T> {
    if (index >= this.baseUrls.length) {
      return throwError(() => new Error('No API base URL configured.'));
    }

    const url = `${this.baseUrls[index]}/${endpoint.replace(/^\/+/, '')}`;
    return this.http.post<T>(url, payload).pipe(
      catchError((error) => {
        if (index + 1 < this.baseUrls.length) {
          return this.tryPost<T>(endpoint, payload, index + 1);
        }
        return throwError(() => error);
      })
    );
  }

  private tryPut<T>(endpoint: string, payload: unknown, index: number): Observable<T> {
    if (index >= this.baseUrls.length) {
      return throwError(() => new Error('No API base URL configured.'));
    }

    const url = `${this.baseUrls[index]}/${endpoint.replace(/^\/+/, '')}`;
    return this.http.put<T>(url, payload).pipe(
      catchError((error) => {
        if (index + 1 < this.baseUrls.length) {
          return this.tryPut<T>(endpoint, payload, index + 1);
        }
        return throwError(() => error);
      })
    );
  }

  private tryDelete<T>(endpoint: string, index: number): Observable<T> {
    if (index >= this.baseUrls.length) {
      return throwError(() => new Error('No API base URL configured.'));
    }

    const url = `${this.baseUrls[index]}/${endpoint.replace(/^\/+/, '')}`;
    return this.http.delete<T>(url).pipe(
      catchError((error) => {
        if (index + 1 < this.baseUrls.length) {
          return this.tryDelete<T>(endpoint, index + 1);
        }
        return throwError(() => error);
      })
    );
  }
}
