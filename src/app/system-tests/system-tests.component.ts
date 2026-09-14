import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, Observable, of, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { SystemTestsService } from '../services/system-tests.service';
import { BatchService } from '../services/batch.service';
import { AreaService } from '../services/area.service';
import { Area } from '../models/area.model';
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
  orderReference: string;
  expectedBatch: string;
  actualBatch: string | null;
  resolvedBatchName: string | null;
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
  clockPkt: string; // PKT (Pakistan Standard Time, UTC+5) display string
  areaId: string;
  orderResults: OrderResult[];
  overallResult: 'PASS' | 'FAIL' | 'PENDING';
  summary: string;
  durationMs: number;
}

type OrderCreationOutcome =
  | { kind: 'ok'; orderId: string; orderReference: string }
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

  areas: Area[] = [];
  areasLoading = false;
  areaId = '';
  controlledClockPkt = ''; // PKT (Pakistan Standard Time, UTC+5) — converted to UTC before sending to API
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
    private readonly batchService: BatchService,
    private readonly areaService: AreaService
  ) {}

  ngOnInit(): void {
    const now = new Date();
    // Default controlled clock to today at 10:15 PKT (Pakistan Standard Time, UTC+5).
    // PKT date may differ from UTC date when UTC is after 19:00 (midnight PKT).
    const pktNow = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    const defaultPkt = new Date(Date.UTC(pktNow.getUTCFullYear(), pktNow.getUTCMonth(), pktNow.getUTCDate(), 10, 15, 0));
    this.controlledClockPkt = defaultPkt.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:mm' PKT for datetime-local input

    this.areasLoading = true;
    this.areaService.getAll().subscribe({
      next: (areas) => {
        this.areas = areas;
        this.areasLoading = false;
        if (areas.length > 0) {
          this.areaId = areas[0].id;
          this.loadBatchSchedule();
        }
      },
      error: () => {
        this.areasLoading = false;
      }
    });
  }

  get selectedAreaName(): string {
    return this.areas.find(a => a.id === this.areaId)?.name ?? this.areaId;
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
      value: Array.isArray(val)
        ? val.map((item) => this.stringifyErrorDetail(item)).join(', ')
        : this.stringifyErrorDetail(val)
    }));
  }

  // PKT = UTC+5; UTC = PKT − 5 hours. The API header X-Test-Clock-Override-Utc expects UTC.
  get effectiveClockUtcIso(): string {
    if (!this.controlledClockPkt) return new Date().toISOString();
    const pktMs = new Date(this.controlledClockPkt + ':00Z').getTime();
    const utcMs = pktMs - 5 * 60 * 60 * 1000;
    const offset = this.selectedScenario.clockOffsetMinutes * 60 * 1000;
    return new Date(utcMs + offset).toISOString();
  }

  // PKT display string for UI — does NOT subtract 5h; offset is applied in PKT space.
  get effectiveClockPktDisplay(): string {
    if (!this.controlledClockPkt) return '';
    const pktMs = new Date(this.controlledClockPkt + ':00Z').getTime();
    const offset = this.selectedScenario.clockOffsetMinutes * 60 * 1000;
    return new Date(pktMs + offset).toISOString().slice(0, 16) + ' PKT';
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
    if (this.running || !this.areaId || !this.controlledClockPkt) return;

    this.running = true;
    this.runResult = null;
    this.lastCreatedOrderIds = [];

    const testRunId = this.systemTestsService.generateTestRunId();
    const clockIso = this.effectiveClockUtcIso;         // UTC — sent in X-Test-Clock-Override-Utc header
    const clockPktDisplay = this.effectiveClockPktDisplay; // PKT — shown in UI results
    const orderCount = this.selectedScenario.orderCount;
    const expectedBatch = this.expectedBatchLabel;
    const startMs = Date.now();

    const orderCreations: Observable<OrderCreationOutcome>[] = Array.from({ length: orderCount }, (_, i) =>
      this.systemTestsService.createOrder(
        this.buildTestOrder(i, testRunId),
        clockIso,
        testRunId
      ).pipe(
        map((res): OrderCreationOutcome => ({ kind: 'ok', orderId: res.orderId, orderReference: res.orderReference })),
        catchError((err): Observable<OrderCreationOutcome> => of({ kind: 'err', error: err }))
      )
    );

    forkJoin(orderCreations).pipe(
      switchMap((outcomes) => {
        const okOutcomes = outcomes.filter((o): o is { kind: 'ok'; orderId: string; orderReference: string } => o.kind === 'ok');
        const errOutcomes = outcomes.filter((o): o is { kind: 'err'; error: unknown } => o.kind === 'err');
        const validIds = okOutcomes.map((o) => o.orderId);
        this.lastCreatedOrderIds = validIds;

        const creationFailureResults: OrderResult[] = errOutcomes.map((o, i) => ({
          orderId: `(creation failed #${i + 1})`,
          orderReference: '',
          expectedBatch,
          actualBatch: null,
          resolvedBatchName: null,
          result: 'FAIL' as const,
          ...this.parseHttpError(o.error, 'Order Creation')
        }));

        if (validIds.length === 0) {
          return of({ okOutcomes, orders: [] as Order[], creationFailureResults });
        }

        const clockDate = new Date(clockIso);
        return this.pollForOrders(validIds, clockDate, testRunId).pipe(
          map((orders) => ({ okOutcomes, orders, creationFailureResults }))
        );
      })
    ).subscribe({
      next: ({ okOutcomes, orders, creationFailureResults }) => {
        const polledResults: OrderResult[] = okOutcomes.map((outcome) => {
          const found = orders.find((o) => o.id === outcome.orderId);
          const actual = found?.batchId ?? null;
          const resolvedName = this.resolveBatchIdToName(actual);
          const pass = actual != null && this.batchLabelMatches(actual, expectedBatch);
          const entry: OrderResult = {
            orderId: outcome.orderId,
            orderReference: outcome.orderReference,
            expectedBatch,
            actualBatch: actual,
            resolvedBatchName: resolvedName,
            result: found ? (pass ? 'PASS' : 'FAIL') : 'FAIL'
          };
          if (entry.result === 'FAIL') {
            Object.assign(entry, this.describeBatchAssignmentFailure(actual, resolvedName, expectedBatch, found != null));
          }
          return entry;
        });

        const orderResults = [...polledResults, ...creationFailureResults];
        const allPass = orderResults.every((r) => r.result === 'PASS');

        this.runResult = {
          testRunId,
          scenario: this.selectedScenario.label,
          clockPkt: clockPktDisplay,
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
          clockPkt: clockPktDisplay,
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
      error: (err: unknown) => {
        const httpErr = err as { status?: number; error?: { message?: string; errorMessage?: string }; message?: string };
        const status = httpErr?.status ? `HTTP ${httpErr.status}` : 'Unknown error';
        const message = httpErr?.error?.message || httpErr?.error?.errorMessage || httpErr?.message || 'No details available';
        alert(`Cleanup failed (${status}): ${message}\n\nOrders may need manual removal.`);
      }
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

  private resolveBatchIdToName(batchId: string | null): string | null {
    if (!batchId || this.batchSchedule.length === 0) return null;
    // Batch ID format: {areaId}-{YYYY}-{MM}-{DD}-{batchIndex}; extract the trailing numeric index
    const lastSegment = batchId.split('-').pop();
    if (lastSegment == null) return null;
    const index = parseInt(lastSegment, 10);
    if (isNaN(index)) return null;
    return this.batchSchedule.find(w => w.batchIndex === index)?.label ?? null;
  }

  private batchLabelMatches(batchId: string, expectedLabel: string): boolean {
    if (!expectedLabel || expectedLabel.startsWith('(')) return false;
    const resolvedName = this.resolveBatchIdToName(batchId);
    if (resolvedName != null) {
      return resolvedName.toLowerCase() === expectedLabel.toLowerCase();
    }
    // Fallback substring match when schedule lookup fails
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
      const body = this.parseErrorBody(err.error);
      out.rawResponse = body ?? err.error;
      if (typeof body === 'string' && body) {
        out.errorMessage = body;
      } else if (body instanceof Error) {
        out.errorMessage = err.status === 200
          ? `HTTP 200 response could not be parsed: ${body.message}`
          : body.message;
      } else if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        out.errorMessage = this.firstString(b, ['message', 'errorMessage', 'title', 'error', 'detail']);
        out.errorDetails = this.extractErrorDetails(b);
      } else {
        out.errorMessage = err.message || err.statusText || `HTTP ${err.status}`;
      }

      out.errorMessage = out.errorMessage || err.message || err.statusText || `HTTP ${err.status}`;

      if (err.status === 0 || err.status >= 500) {
        out.errorCategory = 'infra';
      } else if (err.status === 200) {
        out.errorCategory = 'infra';
      } else if (err.status === 404) {
        out.errorCategory = 'misconfiguration';
      } else {
        // 400 / 422 — distinguish misconfiguration from field validation
        const haystack = [
          out.errorMessage ?? '',
          this.stringifyErrorDetail(out.errorDetails ?? ''),
          this.stringifyErrorDetail(body ?? '')
        ].join(' ').toLowerCase();
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

  private parseErrorBody(body: unknown): unknown {
    if (typeof body !== 'string') return body;

    const trimmed = body.trim();
    if (!trimmed) return body;

    try {
      return JSON.parse(trimmed);
    } catch {
      return body;
    }
  }

  private extractErrorDetails(body: Record<string, unknown>): unknown {
    const errors = body['errors'];
    if (errors && typeof errors === 'object') {
      return errors;
    }

    const fieldErrors = body['fieldErrors'];
    if (Array.isArray(fieldErrors)) {
      return this.groupFieldErrors(fieldErrors);
    }

    const details = body['errorDetails'] ?? body['details'];
    return details === undefined ? undefined : details;
  }

  private groupFieldErrors(fieldErrors: unknown[]): Record<string, string[]> {
    return fieldErrors.reduce<Record<string, string[]>>((acc, item) => {
      if (!item || typeof item !== 'object') return acc;

      const error = item as Record<string, unknown>;
      const field = this.firstString(error, ['field', 'name', 'key']) || 'general';
      const message = this.firstString(error, ['message', 'errorMessage', 'error'])
        || this.stringifyErrorDetail(error);

      if (!acc[field]) acc[field] = [];
      acc[field].push(message);
      return acc;
    }, {} as Record<string, string[]>);
  }

  private firstString(source: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return undefined;
  }

  private stringifyErrorDetail(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (value instanceof Error) return value.message;

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private describeBatchAssignmentFailure(
    actual: string | null,
    resolvedName: string | null,
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
    const displayActual = resolvedName != null
      ? `"${resolvedName}" (raw batch ID: ${actual})`
      : `"${actual}"`;
    return {
      errorStage: 'Batch Assignment',
      errorMessage: `Batch mismatch — expected "${expected}", got ${displayActual}. Check the batch schedule for area "${this.areaId}" at the controlled clock time.`,
      errorCategory: 'misconfiguration'
    };
  }
}
