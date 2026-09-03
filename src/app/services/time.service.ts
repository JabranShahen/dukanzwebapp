import { Injectable } from '@angular/core';

/** Feature flag: set to true to enable Test Dashboard route/UI (TestAdmin role required). */
export const ENABLE_TEST_DASHBOARD = false;

@Injectable({ providedIn: 'root' })
export class TimeService {
  private _override: Date | null = null;

  /** Returns the current time, respecting any active override. */
  now(): Date {
    return this._override ? new Date(this._override) : new Date();
  }

  /** Override the clock for this session (ISO 8601 UTC string or null to clear). */
  setOverride(isoUtc: string | null): void {
    this._override = isoUtc ? new Date(isoUtc) : null;
  }

  clearOverride(): void {
    this._override = null;
  }

  isOverrideActive(): boolean {
    return this._override !== null;
  }
}
