import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';

import { ApiService } from '../services/api-service';
import { ManagementHeaderComponent } from '../shared/management-header/management-header.component';
import { ManagementPanelComponent } from '../shared/management-panel/management-panel.component';
import { UiButtonComponent } from '../shared/ui/ui-button/ui-button.component';
import { UiFeedbackComponent } from '../shared/ui/ui-feedback/ui-feedback.component';

interface BroadcastResult {
  notified: number;
  total: number;
}

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, ManagementHeaderComponent, ManagementPanelComponent, UiButtonComponent, UiFeedbackComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <app-management-header
        eyebrow="Notifications"
        title="App Update Broadcast"
        subtext="Send a push notification to all registered devices informing users that a new version of Dukanz is available."
      ></app-management-header>

      <app-management-panel title="Broadcast" description="Triggers an FCM push notification to every device with a registered token.">
        <app-ui-feedback *ngIf="feedbackMessage" [tone]="feedbackTone" [message]="feedbackMessage"></app-ui-feedback>

        <div class="action-row">
          <app-ui-button [disabled]="sending" (clicked)="broadcast()">
            {{ sending ? 'Sending...' : 'Notify All Users' }}
          </app-ui-button>
        </div>
      </app-management-panel>
    </div>
  `,
  styles: [`
    .page { display: grid; gap: 1.5rem; }
    .action-row { padding-top: 0.5rem; }
  `],
})
export class NotificationsPageComponent {
  private readonly api = inject(ApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  sending = false;
  feedbackMessage = '';
  feedbackTone: 'info' | 'success' | 'error' = 'info';

  broadcast(): void {
    if (this.sending) return;
    this.sending = true;
    this.feedbackMessage = '';
    this.cdr.markForCheck();

    this.api.post<BroadcastResult>('api/Notification/broadcast-app-update', {}).subscribe({
      next: (res) => {
        this.feedbackTone = 'success';
        this.feedbackMessage = `Notified ${res.notified} of ${res.total} devices successfully.`;
        this.sending = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.feedbackTone = 'error';
        this.feedbackMessage = 'Failed to send notifications. Please try again.';
        this.sending = false;
        this.cdr.markForCheck();
      },
    });
  }
}
