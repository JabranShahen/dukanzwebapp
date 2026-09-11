import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, Observable, of, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { SystemTestsService } from '../services/system-tests.service';
import { BatchService } from '../services/batch.service';
import { Order } from '../models/order.model';
import { BatchScheduleWindow } from '../models/batch-schedule.model';

export type ScenarioKey =
  | 'single-batch'
  | 'five-batch'
  | 'before-cutoff'
  | 'at-cutoff'
  | 'after-cutoff'
  | 'zero-price';

export interface ScenarioConfig {
  key: ScenarioKey;
  label: string;
  description: string;
  orderCount: number;
  clockOffsetMinutes: number; // minutes relative to the configured clock time
}

export interface OrderResult {
  orderId: string;
  expectedBatch: string;
  actualBatch: string | null;
  result: 'PASS' | 'FAIL' | 'PENDING';
  errorStage?: string;
  errorStatus?: number;
  errorMessage?: string;
  errorDetails?: unknown;
  errorCategory?: 'misconfiguration' | 'validation' | 'infra';
  rawResponse?: unknown;
  showRawResponse?: boolean;
}

export interface TestRunResult {
  testRunId: string;
  scenario: string;
  clockUtc: string;
  areaId: string;
  orderResults: OrderResult[];
  overallResult: 'PASS' | 'FAIL' | 'PENDING';
  summary: string;
  durationMs: number;
}

type OrderCreationOutcome =
  | { kind: 'ok'; orderId: string }
  | { kind: 'err'; error: unknown };

const SCENARIOS: ScenarioConfig[] = [
  {
    key: 'single-batch',
    label: 'Single order assigned to correct batch',
    description: 'Creates one order at the controlled time and verifies it lands in the expected batch.',
    orderCount: 1,
    clockOffsetMinutes: 0
  },
  {
    key: 'five-batch',
    label: 'Five orders assigned to correct batch',
    description: 'Creates five orders and verifies all land in the same expected batch.',
    orderCount: 5,
    clockOffsetMinutes: 0
  },
  {
    key: 'before-cutoff',
    label: 'Order immediately before cutoff',
    description: 'Creates an order 1 minute before the batch cutoff and verifies the pre-cutoff batch.',
    orderCount: 1,
    clockOffsetMinutes: -1
  },
  {
    key: 'at-cutoff',
    label: 'Order exactly at cutoff',
    description: 'Creates an order at the exact cutoff time and verifies the resulting batch assignment.',
    orderCount: 1,
    clockOffsetMinutes: 0
  },
  {
    key: 'after-cutoff',
    label: 'Order immediately after cutoff',
    description: 'Creates an order 1 minute after the batch cutoff and verifies the post-cutoff batch.',
    orderCount: 1,
    clockOffsetMinutes: 1
  },
  {
    key: 'zero-price',
    label: 'Zero-price item order',
    description: 'Creates an order containing an item with price = 0 and quantity > 0. Verifies the order is accepted and assigned normally.',
    orderCount: 1,
    clockOffsetMinutes: 0
  }
];

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 30000;

@Component({
  selector: 'app-system-tests',
  templateUrl: './system-tests.component.html',
  styleUrls: ['./system-tests.component.scss']
})
export class SystemTestsComponent implements OnInit {
  readonly scenarios = SCENARIOS;

  areaId = 'area_test_01';
  controlledClockUtc = '';
  cutoffTimeLocal = '10:00';
  selectedScenario: ScenarioConfig = SCENARIOS[0];

  batchSchedule: BatchScheduleWindow[] = [];
  scheduleLoaded = false;
  scheduleError = '';

  running = false;
  runResult: TestRunResult | null = null;
  lastCreatedOrderIds: string[] = [];

  constructor(
    private readonly systemTestsService: SystemTestsService,
    private readonly batchService: BatchService
  ) {}

  ngOnInit(): void {
    const now = new Date();
    // Default controlled clock to today at 10:15 UTC (a common mid-morning slot)
    const defaultClock = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 10, 15, 0));
    this.controlledClockUtc = defaultClock.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:mm' for datetime-local input
  }

  loadBatchSchedule(): void {
    if (!this.areaId) return;
    this.scheduleError = '';
    this.batchService.getSchedule(this.areaId).subscribe({
      next: (schedule) => {
        this.batchSchedule = schedule;
        this.scheduleLoaded = true;
      },
      error: () => {
        this.scheduleError = 'Failed to load batch schedule for this area.';
      }
    });
  }

  selectScenario(scenario: ScenarioConfig): void {
    this.selectedScenario = scenario;
    this.runResult = null;
  }

  toggleRawResponse(result: OrderResult): void {
    result.showRawResponse = !result.showRawResponse;
  }

  errorDetailsEntries(details: unknown): { key: string; value: string }[] {
    if (!details || typeof details !== 'object' || Array.isArray(details)) return [];
    return Object.entries(details as Record<string, unknown>).map(([key, val]) => ({
      key,
      value: Array.isArray(val) ? val.join(', ') : String(val)
    }));
  }

  get effectiveClockUtcIso(): string {
    if (!this.controlledClockUtc) return new Date().toISOString();
    const base = new Date(this.controlledClockUtc + ':00Z');
    const offset = this.selectedScenario.clockOffsetMinutes * 60 * 1000;
    return new Date(base.getTime() + offset).toISOString();
  }

  get expectedBatchLabel(): string {
    if (this.batchSchedule.length === 0) return '(load schedule to see expected batch)';
    const clockDate = new Date(this.effectiveClockUtcIso);
    // Convert UTC clock to PKT (UTC+5) for comparison with schedule times
    const pktHours = clockDate.getUTCHours() + 5;
    const pktMinutes = clockDate.getUTCMinutes();
    const pktTotalMinutes = (pktHours % 24) * 60 + pktMinutes;

    for (const w of this.batchSchedule) {
      if (!w.enabled) continue;
      const [startH, startM] = w.startTimePkt.split(':').map(Number);
      const [endH, endM] = w.endTimePkt.split(':').map(Number);
      const start = startH * 60 + startM;
      const end = endH * 60 + endM;
      if (pktTotalMinutes >= start && pktTotalMinutes < end) {
        return w.label;
      }
    }
    return 'No batch (outside schedule)';
  }

  runTest(): void {
    if (this.running || !this.areaId || !this.controlledClockUtc) return;

    this.running = true;
    this.runResult = null;
    this.lastCreatedOrderIds = [];

    const testRunId = this.systemTestsService.generateTestRunId();
    const clockIso = this.effectiveClockUtcIso;
    const orderCount = this.selectedScenario.orderCount;
    const expectedBatch = this.expectedBatchLabel;
    const startMs = Date.now();

    const orderCreations: Observable<OrderCreationOutcome>[] = Array.from({ length: orderCount }, (_, i) =>
      this.systemTestsService.createOrder(
        this.buildTestOrder(i, testRunId),
        clockIso,
        testRunId
      ).pipe(
        map((id): OrderCreationOutcome => ({ kind: 'ok', orderId: id })),
        catchError((err): Observable<OrderCreationOutcome> => of({ kind: 'err', error: err }))
      )
    );

    forkJoin(orderCreations).pipe(
      switchMap((outcomes) => {
        const okOutcomes = outcomes.filter((o): o is { kind: 'ok'; orderId: string } => o.kind === 'ok');
        const errOutcomes = outcomes.filter((o): o is { kind: 'err'; error: unknown } => o.kind === 'err');
        const validIds = okOutcomes.map((o) => o.orderId);
        this.lastCreatedOrderIds = validIds;

        const creationFailureResults: OrderResult[] = errOutcomes.map((o, i) => ({
          orderId: `(creation failed #${i + 1})`,
          expectedBatch,
          actualBatch: null,
          result: 'FAIL' as const,
          ...this.parseHttpError(o.error, 'Order Creation')
        }));

        if (validIds.length === 0) {
          return of({ validIds, orders: [] as Order[], creationFailureResults });
        }

        const clockDate = new Date(clockIso);
        return this.pollForOrders(validIds, clockDate, testRunId).pipe(
          map((orders) => ({ validIds, orders, creationFailureResults }))
        );
      })
    ).subscribe({
      next: ({ validIds, orders, creationFailureResults }) => {
        const polledResults: OrderResult[] = validIds.map((id) => {
          const found = orders.find((o) => o.id === id);
          const actual = found?.batchId ?? null;
          const pass = actual != null && this.batchLabelMatches(actual, expectedBatch);
          const entry: OrderResult = {
            orderId: id,
            expectedBatch,
            actualBatch: actual,
            result: found ? (pass ? 'PASS' : 'FAIL') : 'FAIL'
          };
          if (entry.result === 'FAIL') {
            Object.assign(entry, this.describeBatchAssignmentFailure(actual, expectedBatch, found != null));
          }
          return entry;
        });

        const orderResults = [...polledResults, ...creationFailureResults];
        const allPass = orderResults.every((r) => r.result === 'PASS');

        this.runResult = {
          testRunId,
          scenario: this.selectedScenario.label,
          clockUtc: clockIso,
          areaId: this.areaId,
          orderResults,
          overallResult: allPass ? 'PASS' : 'FAIL',
          summary: allPass
            ? `All ${orderResults.length} order(s) assigned to expected batch.`
            : `${orderResults.filter((r) => r.result === 'FAIL').length} order(s) failed.`,
          durationMs: Date.now() - startMs
        };
        this.running = false;
      },
      error: (err) => {
        this.runResult = {
          testRunId,
          scenario: this.selectedScenario.label,
          clockUtc: clockIso,
          areaId: this.areaId,
          orderResults: [],
          overallResult: 'FAIL',
          summary: `Test run failed with error: ${String(err?.message ?? err)}`,
          durationMs: Date.now() - startMs
        };
        this.running = false;
      }
    });
  }

  cleanup(): void {
    if (this.lastCreatedOrderIds.length === 0 || !this.runResult) return;
    const { testRunId } = this.runResult;
    this.systemTestsService.cleanupTestRun(testRunId, this.lastCreatedOrderIds).subscribe({
      next: (result) => {
        alert(`Cleanup done: ${result.summary}`);
        this.lastCreatedOrderIds = [];
      },
      error: () => alert('Cleanup call failed. Orders may need manual removal.')
    });
  }

  private buildTestOrder(index: number, testRunId: string): Partial<Order> {
    const isZeroPrice = this.selectedScenario.key === 'zero-price';
    return {
      id: `${testRunId}-${index + 1}`,
      deviceID: testRunId,
      areaId: this.areaId,
      status: 'Approved',
      orderTotalPrice: isZeroPrice ? 0 : 250,
      orderGrossPrice: isZeroPrice ? 0 : 250,
      deliveryChargeApplied: 0,
      orderDeviceDttm: new Date().toISOString(),
      specialInstructions: `[TEST] scenario=${this.selectedScenario.key} idx=${index} run=${testRunId}`,
      orderItems: [
        {
          id: `test-item-${index}`,
          product: {
            id: 'test-product-001',
            productName: 'Test Product',
            unitName: 'unit'
          },
          quantity: 1,
          orderItemTotalPrice: isZeroPrice ? 0 : 250
        }
      ]
    } as Partial<Order>;
  }

  private pollForOrders(
    orderIds: string[],
    clockDate: Date,
    testRunId: string
  ): Observable<Order[]> {
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    const poll = (): Observable<Order[]> => {
      return this.systemTestsService.getOrdersForDate(clockDate).pipe(
        switchMap((orders) => {
          const found = orders.filter((o) => orderIds.includes(o.id) && o.batchId != null);
          if (found.length === orderIds.length || Date.now() >= deadline) {
            // Return all matching orders, even those without batch yet (timeout path)
            const all = orders.filter((o) => orderIds.includes(o.id));
            return of(all);
          }
          return timer(POLL_INTERVAL_MS).pipe(switchMap(() => poll()));
        })
      );
    };

    return poll();
  }

  private batchLabelMatches(batchId: string, expectedLabel: string): boolean {
    if (!expectedLabel || expectedLabel.startsWith('(')) return false;
    // Compare by label or id — backend may return batchId or label
    return batchId.toLowerCase().includes(expectedLabel.toLowerCase()) ||
           expectedLabel.toLowerCase().includes(batchId.toLowerCase());
  }

  private parseHttpError(
    err: unknown,
    stage: string
  ): Pick<OrderResult, 'errorStage' | 'errorStatus' | 'errorMessage' | 'errorDetails' | 'errorCategory' | 'rawResponse'> {
    const out: Pick<OrderResult, 'errorStage' | 'errorStatus' | 'errorMessage' | 'errorDetails' | 'errorCategory' | 'rawResponse'> = {
      errorStage: stage
    };

    if (err instanceof HttpErrorResponse) {
      out.errorStatus = err.status;
      out.rawResponse = err.error;

      const body = err.error;
      if (typeof body === 'string' && body) {
        out.errorMessage = body;
      } else if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        const msg = b['message'] ?? b['title'] ?? b['error'] ?? err.statusText;
        out.errorMessage = typeof msg === 'string' ? msg : undefined;
        if (b['errors'] && typeof b['errors'] === 'object') {
          out.errorDetails = b['errors'];
        }
      } else {
        out.errorMessage = err.message || err.statusText || `HTTP ${err.status}`;
      }

      if (err.status === 0 || err.status >= 500) {
        out.errorCategory = 'infra';
      } else if (err.status === 404) {
        out.errorCategory = 'misconfiguration';
      } else {
        // 400 / 422 — distinguish misconfiguration from field validation
        const haystack = [out.errorMessage ?? '', JSON.stringify(out.errorDetails ?? '')].join(' ').toLowerCase();
        out.errorCategory = (haystack.includes('product') || haystack.includes('area') || haystack.includes('not found'))
          ? 'misconfiguration'
          : 'validation';
      }
    } else if (err instanceof Error) {
      out.errorMessage = err.message;
      out.errorCategory = 'infra';
    } else {
      out.errorMessage = String(err);
      out.errorCategory = 'infra';
    }

    return out;
  }

  private describeBatchAssignmentFailure(
    actual: string | null,
    expected: string,
    orderFound: boolean
  ): Pick<OrderResult, 'errorStage' | 'errorMessage' | 'errorCategory'> {
    if (!orderFound) {
      return {
        errorStage: 'Batch Assignment',
        errorMessage: `Order not found in results after ${POLL_TIMEOUT_MS / 1000}s. Check areaId "${this.areaId}" and that orders are indexed for this date.`,
        errorCategory: 'misconfiguration'
      };
    }
    if (actual == null) {
      return {
        errorStage: 'Batch Assignment',
        errorMessage: `Order created but unassigned after ${POLL_TIMEOUT_MS / 1000}s. No batch window may cover this clock time, or the batch scheduler did not run.`,
        errorCategory: 'misconfiguration'
      };
    }
    return {
      errorStage: 'Batch Assignment',
      errorMessage: `Batch mismatch — expected "${expected}", got "${actual}". Check the batch schedule for area "${this.areaId}" at the controlled clock time.`,
      errorCategory: 'misconfiguration'
    };
  }
}
