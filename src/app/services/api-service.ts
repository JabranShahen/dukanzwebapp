import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  readonly apiRoots = [environment.api.baseUrl, ...(environment.api.fallbackBaseUrls ?? [])]
    .map((url) => url.replace(/\/$/, ''))
    .filter((url, index, urls) => Boolean(url) && urls.indexOf(url) === index);

  constructor(private readonly http: HttpClient) {}

  get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Observable<T> {
    return this.requestWithFallback((url) => this.http.get<T>(url, { params: this.coerceParams(params) }), endpoint);
  }

  post<T>(endpoint: string, body: unknown): Observable<T> {
    return this.requestWithFallback((url) => this.http.post<T>(url, body), endpoint);
  }

  put<T>(endpoint: string, body: unknown): Observable<T> {
    return this.requestWithFallback((url) => this.http.put<T>(url, body), endpoint);
  }

  delete<T>(
    endpoint: string,
    options?: {
      body?: unknown;
      params?: Record<string, string | number | boolean>;
    },
  ): Observable<T> {
    return this.requestWithFallback(
      (url) =>
        this.http.delete<T>(url, {
          body: options?.body,
          params: this.coerceParams(options?.params),
        }),
      endpoint,
    );
  }

  private requestWithFallback<T>(
    requestFactory: (url: string) => Observable<T>,
    endpoint: string,
    index = 0,
  ): Observable<T> {
    const url = this.buildUrl(this.apiRoots[index], endpoint);
    return requestFactory(url).pipe(
      catchError((error: unknown) => {
        if (this.shouldRetryWithFallback(error) && index < this.apiRoots.length - 1) {
          return this.requestWithFallback(requestFactory, endpoint, index + 1);
        }
        return throwError(() => error);
      }),
    );
  }

  private shouldRetryWithFallback(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse)) {
      return false;
    }

    return error.status === 0;
  }

  private buildUrl(apiRoot: string, endpoint: string): string {
    return `${apiRoot}/${endpoint.replace(/^\//, '')}`;
  }

  private coerceParams(params?: Record<string, string | number | boolean>): Record<string, string> | undefined {
    if (!params) {
      return undefined;
    }

    return Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)]));
  }
}
