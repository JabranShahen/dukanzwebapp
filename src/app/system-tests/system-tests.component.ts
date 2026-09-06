import { Component, OnInit } from '@angular/core';
import { forkJoin, Observable, of, timer } from 'rxjs';
import { catchError, switchMap, take } from 'rxjs/operators';

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

    const orderCreations = Array.from({ length: orderCount }, (_, i) =>
      this.systemTestsService.createOrder(
        this.buildTestOrder(i, testRunId),
        clockIso,
        testRunId
      ).pipe(catchError(() => of(null)))
    );

    forkJoin(orderCreations).pipe(
      switchMap((createdIds) => {
        const validIds = createdIds.filter((id): id is string => typeof id === 'string' && !!id);
        this.lastCreatedOrderIds = validIds;

        if (validIds.length === 0) {
          return of({ validIds, orders: [] as Order[] });
        }

        const clockDate = new Date(clockIso);
        return this.pollForOrders(validIds, clockDate, testRunId).pipe(
          switchMap((orders) => of({ validIds, orders }))
        );
      })
    ).subscribe({
      next: ({ validIds, orders }) => {
        const orderResults: OrderResult[] = validIds.map((id) => {
          const found = orders.find((o) => o.id === id);
          const actual = found?.batchId ?? null;
          const pass = actual != null && this.batchLabelMatches(actual, expectedBatch);
          return {
            orderId: id,
            expectedBatch,
            actualBatch: actual,
            result: found ? (pass ? 'PASS' : 'FAIL') : 'FAIL'
          };
        });

        // Handle case where no orders were created (creation failures)
        const failedCreations = orderCount - validIds.length;
        for (let i = 0; i < failedCreations; i++) {
          orderResults.push({
            orderId: `(creation failed #${i + 1})`,
            expectedBatch,
            actualBatch: null,
            result: 'FAIL'
          });
        }

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
  ) {
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
}
