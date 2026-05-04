import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../auth.service';
import { Area } from '../models/area.model';
import { CreateStaffRequest, StaffAccount } from '../models/staff.model';
import { AreaService } from '../services/area.service';
import { StaffService } from '../services/staff.service';

interface StaffDraft {
  name: string;
  areaId: string | null;
  role: string;
  enabled: boolean;
}

@Component({
  selector: 'app-staff-management',
  templateUrl: './staff-management.component.html',
  styleUrls: ['./staff-management.component.scss']
})
export class StaffManagementComponent implements OnInit {
  loading = false;
  creating = false;
  updatingId: string | null = null;
  error = '';
  feedbackMessage = '';
  feedbackTone: 'success' | 'error' = 'success';

  staff: StaffAccount[] = [];
  areas: Area[] = [];
  draftStaff: Record<string, StaffDraft> = {};
  newStaff: CreateStaffRequest = this.buildEmptyStaff();

  constructor(
    public readonly authService: AuthService,
    private readonly staffService: StaffService,
    private readonly areaService: AreaService
  ) {}

  ngOnInit(): void {
    if (!this.isSuperAdmin) {
      return;
    }

    this.load();
    this.loadAreas();
  }

  get isSuperAdmin(): boolean {
    return this.authService.currentRole === 'superadmin';
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.staffService.getAll().subscribe({
      next: (staff) => {
        this.staff = staff.sort((a, b) => a.name.localeCompare(b.name));
        this.draftStaff = this.staff.reduce<Record<string, StaffDraft>>((acc, account) => {
          acc[account.id] = this.toDraft(account);
          return acc;
        }, {});
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load staff.';
        this.loading = false;
      }
    });
  }

  loadAreas(): void {
    this.areaService.getAll().subscribe({
      next: (areas) => {
        this.areas = areas.sort((a, b) => a.name.localeCompare(b.name));
      },
      error: () => {
        this.areas = [];
      }
    });
  }

  create(): void {
    const request: CreateStaffRequest = {
      name: this.newStaff.name.trim(),
      email: this.newStaff.email.trim().toLowerCase(),
      password: this.newStaff.password,
      areaId: this.newStaff.areaId || null,
      role: this.normalizeRole(this.newStaff.role)
    };

    if (!request.name || !request.email || !request.password) {
      this.error = 'Name, email, and password are required.';
      return;
    }

    if (request.password.length < 8) {
      this.error = 'Password must be at least 8 characters.';
      return;
    }

    this.creating = true;
    this.error = '';
    this.clearFeedback();
    this.staffService.create(request).subscribe({
      next: () => {
        this.creating = false;
        this.newStaff = this.buildEmptyStaff();
        this.showFeedback('Staff member created.', 'success');
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.creating = false;
        this.showFeedback(
          error.status === 409
            ? 'A staff member with this email already exists.'
            : 'Failed to create staff member.',
          'error'
        );
      }
    });
  }

  save(account: StaffAccount): void {
    const draft = this.draftStaff[account.id];
    if (!draft || !draft.name.trim()) {
      this.error = 'Staff name is required.';
      return;
    }

    this.update(account, {
      name: draft.name.trim(),
      areaId: draft.areaId || null,
      role: this.normalizeRole(draft.role),
      enabled: draft.enabled
    }, 'Staff member updated.');
  }

  toggleEnabled(account: StaffAccount): void {
    const draft = this.draftStaff[account.id] ?? this.toDraft(account);
    draft.enabled = !account.enabled;
    this.draftStaff[account.id] = draft;

    this.update(account, {
      name: draft.name.trim(),
      areaId: draft.areaId || null,
      role: this.normalizeRole(draft.role),
      enabled: draft.enabled
    }, `Staff member ${draft.enabled ? 'enabled' : 'disabled'}.`);
  }

  onFeedbackDismissed(): void {
    this.clearFeedback();
  }

  trackById(_: number, account: StaffAccount): string {
    return account.id;
  }

  private update(account: StaffAccount, patch: Partial<StaffAccount>, message: string): void {
    this.updatingId = account.id;
    this.error = '';
    this.clearFeedback();
    this.staffService.update(account.id, patch).subscribe({
      next: () => {
        Object.assign(account, patch);
        this.draftStaff[account.id] = this.toDraft(account);
        this.updatingId = null;
        this.showFeedback(message, 'success');
      },
      error: () => {
        this.updatingId = null;
        this.showFeedback('Failed to update staff member.', 'error');
      }
    });
  }

  private toDraft(account: StaffAccount): StaffDraft {
    return {
      name: account.name,
      areaId: account.areaId ?? null,
      role: this.normalizeRole(account.role),
      enabled: account.enabled
    };
  }

  private buildEmptyStaff(): CreateStaffRequest {
    return {
      name: '',
      email: '',
      password: '',
      areaId: null,
      role: 'operator'
    };
  }

  private normalizeRole(role: string | undefined): string {
    return role === 'superadmin' ? 'superadmin' : 'operator';
  }

  private showFeedback(message: string, tone: 'success' | 'error'): void {
    this.feedbackMessage = message;
    this.feedbackTone = tone;
  }

  private clearFeedback(): void {
    this.feedbackMessage = '';
  }
}
