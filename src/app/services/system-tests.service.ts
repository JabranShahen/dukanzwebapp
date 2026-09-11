import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../environments/environment';
import { Order } from '../models/order.model';
import { BatchScheduleWindow } from '../models/batch-schedule.model';

export interface TestCleanupRequest {
  orderIds: string[];
}

export interface TestCleanupResult {
  testRunId: string;
  deleted: string[];
  skipped: string[];
  failed: string[];
  summary: string;
}

@Injectable({ providedIn: 'root' })
export class SystemTestsService {
  private readonly baseUrl: string;

  // Header name must match TestClockOverrideMiddleware.HeaderName
  static readonly ClockOverrideHeader = 'X-Test-Clock-Override-Utc';

  constructor(private readonly http: HttpClient) {
    this.baseUrl = (environment.apiBaseUrl || '').replace(/\/+$/, '');
  }

  generateTestRunId(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const ms = now.getTime().toString().slice(-4);
    return `tr_${date}_${ms}`;
  }

  /**
   * Creates an order through the existing POST /api/Order endpoint,
   * sending the controlled test clock and testRunId correlation.
   * The auth token is added automatically by AuthInterceptor.
   */
  createOrder(order: Partial<Order>, clockUtcIso: string, testRunId: string): Observable<string> {
    const url = `${this.baseUrl}/Order`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      [SystemTestsService.ClockOverrideHeader]: clockUtcIso
    });
    // Store testRunId in deviceID so the cleanup endpoint can verify test ownership
    const payload: Partial<Order> = { ...order, deviceID: testRunId };
    return this.http.post<{ orderId: string }>(url, payload, { headers }).pipe(
      map(res => res.orderId)
    );
  }

  /**
   * Reads orders for a given date using the existing GET endpoint.
   * Re-uses the same underlying HTTP client (auth token added by interceptor).
   */
  getOrdersForDate(date: Date): Observable<Order[]> {
    const isoDate = date.toISOString().split('T')[0];
    return this.http.get<Order[] | null>(`${this.baseUrl}/Order/getListOfOrdersForDate/${isoDate}`).pipe(
      map((res) => (Array.isArray(res) ? res : [])),
      catchError(() => of([]))
    );
  }

  /**
   * Reads the batch schedule for the given area using the existing GET endpoint.
   */
  getBatchSchedule(areaId: string): Observable<BatchScheduleWindow[]> {
    return this.http.get<BatchScheduleWindow[] | null>(
      `${this.baseUrl}/batch/schedule/${encodeURIComponent(areaId)}`
    ).pipe(
      map((res) => (Array.isArray(res) ? res : [])),
      catchError(() => of([]))
    );
  }

  /**
   * Cleans up orders belonging to a test run.
   * Server verifies each order's deviceID matches the testRunId before deleting.
   */
  cleanupTestRun(testRunId: string, orderIds: string[]): Observable<TestCleanupResult> {
    const url = `${this.baseUrl}/test-support/runs/${encodeURIComponent(testRunId)}`;
    const body: TestCleanupRequest = { orderIds };
    return this.http.delete<TestCleanupResult>(url, { body });
  }
}
